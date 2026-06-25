// saveSignUpList.js

export function readSignupListSettingsFromDOM() {
  const signupEnabled =
    typeof window.getSignupEnabled === "function"
      ? window.getSignupEnabled()
      : false;

  const signupVisibility =
    typeof window.getSignupVisibility === "function"
      ? window.getSignupVisibility()
      : "private";

  const signupFields =
    typeof window.getSignupFields === "function"
      ? window.getSignupFields()
      : ["Name", "Email", "Phone"];

  return {
    signupEnabled,
    signupVisibility,
    signupFields
  };
}