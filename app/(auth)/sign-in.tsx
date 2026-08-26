import { useSignIn } from "@clerk/expo";
import { Link } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import AuthField from "@/components/auth/AuthField";
import AuthScaffold from "@/components/auth/AuthScaffold";
import { colors } from "@/constants/theme";
import { getClerkErrorMessage, getCodeValidationMessage, getEmailValidationMessage, getPasswordValidationMessage } from "@/lib/auth";
import { posthog } from "@/lib/posthog";

type Step = "sign-in" | "mfa" | "forgot" | "reset-code" | "new-password";
type FieldErrors = Partial<Record<"email" | "password" | "code" | "confirmPassword", string>>;

export default function SignInScreen() {
  const { signIn, fetchStatus } = useSignIn();
  const [step, setStep] = useState<Step>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const busy = fetchStatus === "fetching";

  const finishIfComplete = async (event = "user_signed_in") => {
    if (signIn.status !== "complete") return false;
    const { error } = await signIn.finalize();
    if (error) setFormError(getClerkErrorMessage(error));
    else posthog?.capture(event);
    return true;
  };

  const submitSignIn = async () => {
    const nextErrors = { email: getEmailValidationMessage(email), password: password ? undefined : "Enter your password." };
    setFieldErrors(nextErrors); setFormError(undefined);
    if (Object.values(nextErrors).some(Boolean)) return;
    const { error } = await signIn.password({ emailAddress: email.trim().toLowerCase(), password });
    if (error) { setFormError(getClerkErrorMessage(error, "The email or password is incorrect.")); return; }
    if (await finishIfComplete()) return;
    if (signIn.status === "needs_second_factor") {
      const supportsEmail = signIn.supportedSecondFactors.some((factor) => factor.strategy === "email_code");
      if (!supportsEmail) { setFormError("This account requires an authentication method that is not available in this app yet."); return; }
      const { error: sendError } = await signIn.mfa.sendEmailCode();
      if (sendError) { setFormError(getClerkErrorMessage(sendError)); return; }
      setCode(""); setStep("mfa"); setNotice("We sent a security code to your verified email.");
      return;
    }
    setFormError("Your account needs an additional verification step. Please contact support.");
  };

  const verifyMfa = async () => {
    const codeError = getCodeValidationMessage(code); setFieldErrors({ code: codeError }); setFormError(undefined);
    if (codeError) return;
    const { error } = await signIn.mfa.verifyEmailCode({ code: code.trim() });
    if (error) { setFormError(getClerkErrorMessage(error)); return; }
    await finishIfComplete();
  };

  const requestReset = async () => {
    const emailError = getEmailValidationMessage(email); setFieldErrors({ email: emailError }); setFormError(undefined);
    if (emailError) return;
    const { error: createError } = await signIn.create({ identifier: email.trim().toLowerCase() });
    if (createError) { setFormError(getClerkErrorMessage(createError)); return; }
    const { error } = await signIn.resetPasswordEmailCode.sendCode();
    if (error) { setFormError(getClerkErrorMessage(error)); return; }
    setCode(""); setStep("reset-code"); setNotice(`We sent a reset code to ${email.trim().toLowerCase()}.`);
  };

  const verifyResetCode = async () => {
    const codeError = getCodeValidationMessage(code); setFieldErrors({ code: codeError }); setFormError(undefined);
    if (codeError) return;
    const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code: code.trim() });
    if (error) { setFormError(getClerkErrorMessage(error)); return; }
    setPassword(""); setConfirmPassword(""); setStep("new-password"); setNotice(undefined);
  };

  const submitNewPassword = async () => {
    const nextErrors = { password: getPasswordValidationMessage(password), confirmPassword: password !== confirmPassword ? "Passwords do not match." : undefined };
    setFieldErrors(nextErrors); setFormError(undefined);
    if (Object.values(nextErrors).some(Boolean)) return;
    const { error } = await signIn.resetPasswordEmailCode.submitPassword({ password, signOutOfOtherSessions: true });
    if (error) { setFormError(getClerkErrorMessage(error)); return; }
    await finishIfComplete("password_reset_completed");
  };

  const resetToSignIn = async () => {
    await signIn.reset();
    setStep("sign-in"); setCode(""); setPassword(""); setConfirmPassword(""); setFieldErrors({}); setFormError(undefined); setNotice(undefined);
  };

  if (step === "mfa" || step === "reset-code") {
    const submitCode = step === "mfa" ? verifyMfa : verifyResetCode;
    const resendCode = async () => {
      const { error } = step === "mfa" ? await signIn.mfa.sendEmailCode() : await signIn.resetPasswordEmailCode.sendCode();
      setNotice(error ? undefined : "A fresh security code is on its way.");
      setFormError(error ? getClerkErrorMessage(error) : undefined);
    };
    return (
      <AuthScaffold compact title={step === "mfa" ? "Security check" : "Check your inbox"} subtitle={step === "mfa" ? "Confirm it's really you to finish signing in." : "Enter the code to choose a new password."}>
        <View className="auth-card"><View className="auth-form">
          {notice ? <Text className="auth-success-notice">{notice}</Text> : null}
          <AuthField label="Verification code" value={code} onChangeText={(value) => { setCode(value.replace(/\D/g, "").slice(0, 6)); setFieldErrors({}); }} placeholder="000000" keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={6} style={{ textAlign: "center", fontSize: 24, letterSpacing: 8 }} error={fieldErrors.code} onSubmitEditing={submitCode} />
          {formError ? <Text className="auth-notice">{formError}</Text> : null}
          <Pressable className="auth-button" disabled={busy} onPress={submitCode}>{busy ? <ActivityIndicator color={colors.primary} /> : <Text className="auth-button-text">Continue securely</Text>}</Pressable>
          <Pressable className="auth-secondary-button" disabled={busy} onPress={resendCode}><Text className="auth-secondary-button-text">Send a new code</Text></Pressable>
          <Pressable disabled={busy} onPress={resetToSignIn}><Text className="auth-link text-center">Back to sign in</Text></Pressable>
        </View></View>
      </AuthScaffold>
    );
  }

  if (step === "forgot") return (
    <AuthScaffold compact title="Reset your password" subtitle="We'll email you a secure, single-use recovery code.">
      <View className="auth-card"><View className="auth-form">
        <AuthField label="Email" value={email} onChangeText={(value) => { setEmail(value); setFieldErrors({}); }} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" autoComplete="email" returnKeyType="send" error={fieldErrors.email} onSubmitEditing={requestReset} />
        {formError ? <Text className="auth-notice">{formError}</Text> : null}
        <Pressable className="auth-button" disabled={busy} onPress={requestReset}>{busy ? <ActivityIndicator color={colors.primary} /> : <Text className="auth-button-text">Send recovery code</Text>}</Pressable>
        <Pressable disabled={busy} onPress={resetToSignIn}><Text className="auth-link text-center">Back to sign in</Text></Pressable>
      </View></View>
    </AuthScaffold>
  );

  if (step === "new-password") return (
    <AuthScaffold compact title="Choose a new password" subtitle="Make it memorable, unique, and at least 8 characters.">
      <View className="auth-card"><View className="auth-form">
        <AuthField label="New password" value={password} onChangeText={(value) => { setPassword(value); setFieldErrors((current) => ({ ...current, password: undefined })); }} placeholder="At least 8 characters" isPassword textContentType="newPassword" autoComplete="new-password" error={fieldErrors.password} />
        <AuthField label="Confirm password" value={confirmPassword} onChangeText={(value) => { setConfirmPassword(value); setFieldErrors((current) => ({ ...current, confirmPassword: undefined })); }} placeholder="Enter it again" isPassword textContentType="newPassword" autoComplete="new-password" returnKeyType="done" error={fieldErrors.confirmPassword} onSubmitEditing={submitNewPassword} />
        {formError ? <Text className="auth-notice">{formError}</Text> : null}
        <Pressable className="auth-button" disabled={busy} onPress={submitNewPassword}>{busy ? <ActivityIndicator color={colors.primary} /> : <Text className="auth-button-text">Save and sign in</Text>}</Pressable>
      </View></View>
    </AuthScaffold>
  );

  return (
    <AuthScaffold title="Welcome back" subtitle="Sign in to continue managing your subscriptions.">
      <View className="auth-card"><View className="auth-form">
        <AuthField label="Email" value={email} onChangeText={(value) => { setEmail(value); setFieldErrors((current) => ({ ...current, email: undefined })); }} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" autoComplete="email" returnKeyType="next" error={fieldErrors.email} />
        <View><AuthField label="Password" value={password} onChangeText={(value) => { setPassword(value); setFieldErrors((current) => ({ ...current, password: undefined })); }} placeholder="Enter your password" isPassword textContentType="password" autoComplete="current-password" returnKeyType="done" error={fieldErrors.password} onSubmitEditing={submitSignIn} /><Pressable disabled={busy} onPress={() => { setStep("forgot"); setFormError(undefined); setFieldErrors({}); }}><Text className="auth-inline-action">Forgot password?</Text></Pressable></View>
        {formError ? <Text className="auth-notice">{formError}</Text> : null}
        <Pressable className="auth-button" disabled={busy} onPress={submitSignIn}>{busy ? <ActivityIndicator color={colors.primary} /> : <Text className="auth-button-text">Sign in</Text>}</Pressable>
      </View><View className="auth-link-row"><Text className="auth-link-copy">New to Recurly?</Text><Link href="/(auth)/sign-up" className="auth-link">Create an account</Link></View></View>
    </AuthScaffold>
  );
}
