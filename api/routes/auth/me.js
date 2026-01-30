import { verifyAuth } from "#verifyAuth";

const checkHasPassword = (user) => {
  return !!user.password;
};

export const get = [
  verifyAuth,
  (req, res) => {
    console.log(req.user);

    const hasPasswordFlag = checkHasPassword(req.user);

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        admin: req.user.admin,
        hasPassword: true, //return true for testing 
        suspended: req.user.suspended,
        suspensionReason: req.user.suspensionReason,
      },
    });
  },
];