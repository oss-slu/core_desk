// https://dev-31211352.okta.com/app/dev-31211352_slucammanagementplatform2_1/exkkf5auoaNG9Ogwg5d7/sso/saml
import fs from "fs";

export default {
  entryPoint: "https://dev-31211352.okta.com/app/sso/saml",
  issuer: "slucam-management-platform-10161409",
  callbackUrl: "http://localhost:3000/assertion",
  cert: fs.readFileSync("./okta.cert", "utf-8"), // Add X.509 certificate here
  login:
    "https://dev-31211352.okta.com/app/dev-31211352_slucammanagementplatform2_1/exkkf5auoaNG9Ogwg5d7/sso/saml",
};
