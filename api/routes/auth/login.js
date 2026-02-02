import samlConfig from "../../config/saml-config.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma }  from "#prisma";

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

        const token = jwt.sign( //signed with information
        {
        id:user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            },
            process.env.JWT_SECRET,
            { expiresIn: "3h" }
        );

        return res.status(200).json(token);
      }

    catch(error){
      console.log("Error", error);

      return res.status(500).json({error : "Internal server error"});

    }
  }
]




export const put = [
  async (req, res) => {
    const {userId, firstName, lastName, password} = req.body;
    try{
      const user = await prisma.user.findUnique({ where : {userId}, });


      if (!user || !user.password){ //if there is no user matching the userId
        await prisma.log.create({ data: {type: 'USER_PASSWORD_SET_FAILURE'}, details: `User ID ${userId} not found`});
        
        return res.status(404).json({error : "Failed to find user."});

      }
      const hashedPassword = bcrypt.hash(password, 10);
      
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });
      await prisma.log.create({data : {type : 'USER_PASSWORD_CHANGE', userId: user.id}});
      return res.status(200);
    }

    catch(error){
      console.log("Error", error);

      return res.status(500).json({error : "Internal server error"});

    }
  }
]