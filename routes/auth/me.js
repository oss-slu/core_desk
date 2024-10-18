import { verifyAuth } from "../../util/verifyAuth.js";

export const get = [
  verifyAuth,
  (req, res) => {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        admin: req.user.admin,
      },
    });
  },
];
