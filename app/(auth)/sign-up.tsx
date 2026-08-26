import { useSignUp } from "@clerk/expo";
import { Link } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import AuthField from "@/components/auth/AuthField";
import AuthScaffold from "@/components/auth/AuthScaffold";
import { colors } from "@/constants/theme";
import { getClerkErrorMessage, getCodeValidationMessage, getEmailValidationMessage, getPasswordValidationMessage } from "@/lib/auth";
import { posthog } from "@/lib/posthog";

type FieldErrors = Partial<Record<"email" | "password" | "confirmPassword" | "code", string>>;

export default function SignUpScreen() {
  const { signUp, fetchStatus } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const busy = fetchStatus === "fetching";

  const submitSignUp = async () => {
    const nextErrors: FieldErrors = {
      email: getEmailValidationMessage(email),
      password: getPasswordValidationMessage(password),
      confirmPassword: password !== confirmPassword ? "Passwords do not match." : undefined,
    };
    setFieldErrors(nextErrors);
    setFormError(undefined);
    setNotice(undefined);
    if (Object.values(nextErrors).some(Boolean)) return;

    const { error } = await signUp.password({ emailAddress: email.trim().toLowerCase(), password });
    if (error) {
      setFormError(getClerkErrorMessage(error, "We couldn't create your account."));
      return;
    }
    const { error: sendError } = await signUp.verifications.sendEmailCode();
    if (sendError) {
      setFormError(getClerkErrorMessage(sendError, "We couldn't send your code."));
      return;
    }
    setIsVerifying(true);
    setNotice(`We sent a 6-digit code to ${email.trim().toLowerCase()}.`);
  };

  const verifyEmail = async () => {
    const codeError = getCodeValidationMessage(code);
    setFieldErrors({ code: codeError });
    setFormError(undefined);
    if (codeError) return;
    const { error } = await signUp.verifications.verifyEmailCode({ code: code.trim() });
    if (error) {
      setFormError(getClerkErrorMessage(error, "That code could not be verified."));
      return;
    }
    const { error: finalizeError } = await signUp.finalize();
    if (finalizeError) setFormError(getClerkErrorMessage(finalizeError));
    else posthog?.capture("account_created");
  };

  const resendCode = async () => {
    setFormError(undefined);
    const { error } = await signUp.verifications.sendEmailCode();
    if (error) setFormError(getClerkErrorMessage(error));
    else setNotice("A fresh verification code is on its way.");
  };

  const changeEmail = async () => {
    await signUp.reset();
    setCode(""); setIsVerifying(false); setFormError(undefined); setNotice(undefined);
  };

  if (isVerifying) {
    return (
      <AuthScaffold compact title="Check your inbox" subtitle="Verify your email to secure your new account.">
        <View className="auth-card"><View className="auth-form">
          {notice ? <Text className="auth-success-notice">{notice}</Text> : null}
          <AuthField label="Verification code" value={code} onChangeText={(value) => { setCode(value.replace(/\D/g, "").slice(0, 6)); setFieldErrors({}); }} placeholder="000000" keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={6} style={{ textAlign: "center", fontSize: 24, letterSpacing: 8 }} error={fieldErrors.code} onSubmitEditing={verifyEmail} />
          {formError ? <Text className="auth-notice">{formError}</Text> : null}
          <Pressable className="auth-button" disabled={busy} onPress={verifyEmail}>{busy ? <ActivityIndicator color={colors.primary} /> : <Text className="auth-button-text">Verify and continue</Text>}</Pressable>
          <Pressable className="auth-secondary-button" disabled={busy} onPress={resendCode}><Text className="auth-secondary-button-text">Send a new code</Text></Pressable>
          <Pressable disabled={busy} onPress={changeEmail}><Text className="auth-link text-center">Use a different email</Text></Pressable>
        </View></View>
      </AuthScaffold>
    );
  }

  return (
    <AuthScaffold compact title="Create your account" subtitle="Start managing every subscription with confidence.">
      <View className="auth-card"><View className="auth-form">
        <AuthField label="Email" value={email} onChangeText={(value) => { setEmail(value); setFieldErrors((current) => ({ ...current, email: undefined })); }} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" autoComplete="email" returnKeyType="next" error={fieldErrors.email} />
        <AuthField label="Password" value={password} onChangeText={(value) => { setPassword(value); setFieldErrors((current) => ({ ...current, password: undefined })); }} placeholder="At least 8 characters" isPassword textContentType="newPassword" autoComplete="new-password" returnKeyType="next" error={fieldErrors.password} />
        <AuthField label="Confirm password" value={confirmPassword} onChangeText={(value) => { setConfirmPassword(value); setFieldErrors((current) => ({ ...current, confirmPassword: undefined })); }} placeholder="Enter it again" isPassword textContentType="newPassword" autoComplete="new-password" returnKeyType="done" error={fieldErrors.confirmPassword} onSubmitEditing={submitSignUp} />
        <Text className="auth-helper">Use 8 or more characters. Your session is encrypted and stored securely on this device.</Text>
        {formError ? <Text className="auth-notice">{formError}</Text> : null}
        <View nativeID="clerk-captcha" />
        <Pressable className="auth-button" disabled={busy} onPress={submitSignUp}>{busy ? <ActivityIndicator color={colors.primary} /> : <Text className="auth-button-text">Create account</Text>}</Pressable>
      </View><View className="auth-link-row"><Text className="auth-link-copy">Already have an account?</Text><Link href="/(auth)/sign-in" className="auth-link">Sign in</Link></View></View>
    </AuthScaffold>
  );
}
