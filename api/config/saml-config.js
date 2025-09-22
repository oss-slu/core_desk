// https://dev-31211352.okta.com/app/dev-31211352_slucammanagementplatform2_1/exkkf5auoaNG9Ogwg5d7/sso/saml
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const baseConfig = {
  entryPoint: "https://auth.slu.edu/app/sso/saml",
  issuer: "slu-open-project",
  callbackUrl: process.env.BASE_URL + "/assertion",
  login:
    "https://auth.slu.edu/app/slu_sluopenproject_1/exkvyuwwmsE8VTbxh297/sso/saml",
};

// Always include IdP cert. passport-saml requires it at initialization time.
baseConfig.cert = fs.readFileSync("./okta.cert", "utf-8");

if (process.env.SAML_ALLOW_UNSIGNED === "true") {
  // eslint-disable-next-line no-console
  console.warn(
    "[SAML] WARNING: UNSIGNED responses allowed via dev bypass (SAML_ALLOW_UNSIGNED=true)."
  );
}

export default baseConfig;
