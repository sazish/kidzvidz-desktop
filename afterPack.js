// Ad-hoc code-sign the macOS app after packaging. Apple Silicon refuses to open
// apps with no signature ("…is damaged and can't be opened"); an ad-hoc
// signature avoids that. Users still do right-click → Open once (unidentified
// developer), which is expected without a paid Developer ID certificate.
const { execSync } = require("child_process");
const path = require("path");

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== "darwin") return;
  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  try {
    execSync(`codesign --deep --force -s - "${appPath}"`, { stdio: "inherit" });
    console.log("• ad-hoc signed", appPath);
  } catch (err) {
    console.warn("ad-hoc signing failed:", err.message);
  }
};
