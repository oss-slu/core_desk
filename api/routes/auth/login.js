import samlConfig from "../../config/saml-config.js";

export const get = [
  (req, res) => {
    res.json({
      url: samlConfig.login,
    });
  },
];
