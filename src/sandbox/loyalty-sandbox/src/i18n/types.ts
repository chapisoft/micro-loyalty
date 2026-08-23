export type LanguageCode = 'vi' | 'en' | 'zh' | 'ja' | 'ko';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'vi', label: 'Vietnamese', nativeLabel: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'zh', label: 'Chinese', nativeLabel: '简体中文', flag: '🇨🇳' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어', flag: '🇰🇷' },
];

export interface Translations {
  common: {
    sandboxTitle: string;
    developerPortal: string;
    uatOnline: string;
    downloadPostman: string;
    openSimulator: string;
    logout: string;
    partnerActive: string;
    backToHome: string;
    docs: string;
    copied: string;
    copy: string;
    loading: string;
    download: string;
    selectLanguage: string;
  };
  navigation: {
    menuGroupDocs: string;
    menuGroupTools: string;
    overview: string;
    provisioning: string;
    challengeInit: string;
    verifyOtp: string;
    mobileSdk: string;
    simulatorGuide: string;
    liveSimulator: string;
  };
  landing: {
    badge: string;
    heroTitle1: string;
    heroTitle2: string;
    heroDesc: string;
    btnStart: string;
    btnSimulator: string;
    btnDocs: string;
    statPartners: string;
    statTps: string;
    statSpeed: string;
    statSecurity: string;
    feature1Title: string;
    feature1Desc: string;
    feature2Title: string;
    feature2Desc: string;
    feature3Title: string;
    feature3Desc: string;
    feature4Title: string;
    feature4Desc: string;
    footerCopyright: string;
  };
  login: {
    title: string;
    subtitle: string;
    usernameLabel: string;
    passwordLabel: string;
    usernamePlaceholder: string;
    passwordPlaceholder: string;
    rememberMe: string;
    forgotPassword: string;
    btnLogin: string;
    quickDemoNote: string;
    errorRequired: string;
    loginFailed: string;
  };
  dashboard: {
    welcomeTitle: string;
    welcomeDesc: string;
    partnerCode: string;
    secretKey: string;
    serviceCode: string;
    envBadge: string;
    statApiCalls: string;
    statDevices: string;
    statChallenges: string;
    statSuccessRate: string;
    quickStartTitle: string;
    quickStep1: string;
    quickStep2: string;
    quickStep3: string;
    quickStep4: string;
  };
  docs: {
    tabGuide: string;
    tabSnippets: string;
    tabDownloads: string;
    endpointInfo: string;
    method: string;
    headers: string;
    requestBody: string;
    responseExample: string;
    sdkHubTitle: string;
    sdkHubDesc: string;
    btnDownloadZip: string;
    btnDownloadAll: string;
    noContent: string;
    codeCopied: string;
    copyCode: string;
    iosNativeDesc: string;
    androidNativeDesc: string;
    rnPackageDesc: string;
    flutterPluginDesc: string;
    allSdkBundleTitle: string;
    allSdkBundleDesc: string;
    testParamsTitle: string;
  };
  simulator: {
    title: string;
    subtitle: string;
    showGuideBtn: string;
    hideGuideBtn: string;
    guideTitle: string;
    step1GuideTitle: string;
    step1GuideDesc: string;
    step2GuideTitle: string;
    step2GuideDesc: string;
    step3GuideTitle: string;
    step3GuideDesc: string;
    guideTip: string;
    tabActivate: string;
    tabPin: string;
    tabSign: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    tipTitle: string;
    tipDesc: string;
    challengeControlsTitle: string;
    challengeId: string;
    amount: string;
    toAccount: string;
    btnRandomChallenge: string;
    btnSignOtp: string;
    inspectorTitle: string;
    inspectorLiveBadge: string;
    stepPayload: string;
    stepHmac: string;
    stepTruncate: string;
    stepModulo: string;
    btnVerifyOnline: string;
    deviceScreenTitle: string;
    deviceActivated: string;
    phoneLabel: string;
    activationCodeLabel: string;
    btnActivateDevice: string;
    enterPinTitle: string;
    btnSetPin: string;
    confirmOtp: string;
    btnVerifySuccess: string;
    provisionParamsTitle: string;
    phoneMsisdn: string;
    activationCodeOneTime: string;
    seedKeyEcdh: string;
    btnNextStep2: string;
    pinConfigTitle: string;
    seedKeyPinProtectionTitle: string;
    seedKeyPinProtectionDesc: string;
    pinLabel6Digits: string;
    btnBackStep1: string;
    btnNextStep3: string;
    presetAmountLabel: string;
    verifyActionTitle: string;
    verifyActionDesc: string;
    btnVerifyChecking: string;
    btnVerifyIdle: string;
    phoneEnterPinTitle: string;
    phoneEnterPinSubtitle: string;
    phone6DigitSecretPin: string;
    phoneBack: string;
    phoneConfirmPin: string;
    phoneAmount: string;
    phoneToAccount: string;
    phoneChallengeCode: string;
    phoneOtpTitle: string;
    phoneExpiresIn: string;
    phoneSignChallenge: string;
    phoneChangePin: string;
  };
}
