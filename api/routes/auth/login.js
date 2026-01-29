import samlConfig from "../../config/saml-config.js";
import bcrypt from 'bcrypt';

export const get = [
  (req, res) => {
    res.json({
      url: samlConfig.login,
    });
  },
];


export const post = [
  async (req, res) => {
    const {email, password} = req.body;


    try{
      const user = await prisma.user.findUnique({ where : {email}, });


      if (!user || !user.password){ //if there is no user matching the email or there is null or nothing this means that they are most likely an SSO user
        await prisma.log.create({ data: {type: 'USER_LOGIN_FAILURE'}, details: `Failed to login ${email}`});
        
        return res.status(401).json({error : "Invalid credentials or SSO required"});

      }
      const isMatched = bcrypt.compare(password, user.password);
      if (!isMatched) {
        await prisma.log.create({ data: {type: 'USER_LOGIN_FAILURE', userId: user.id} });
        return res.status(401).json({error : "Invalid credentials "});
      }

      await prisma.log.create({ data : {type: 'USER_LOGIN_LOCAL', userId: user.id}});
      //swap for a token here?
      //return a token and user to the front-end?
    }


    catch(error){
      return res.status(500).json({error : "Internal server error"});

    }
  }
]
