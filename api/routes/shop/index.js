import { LogType } from "@prisma/client";
import { prisma } from "../../util/prisma.js";
import { verifyAuth } from "../../util/verifyAuth.js";
import { SHOP_SELECT } from "./shared.js";

export const get = [
  verifyAuth,
  async (req, res) => {
    try {
      const shops = await prisma.shop.findMany({
        where: {
          users: {
            some: {
              userId: req.user.id,
              active: true,
            },
          },
        },
        select: SHOP_SELECT,
        take: req.query.limit ? parseInt(req.query.limit) : 20,
        skip: req.query.offset ? parseInt(req.query.offset) : 0,
      });

      const totalShops = await prisma.shop.count({
        where: {
          users: {
            some: {
              userId: req.user.id,
              active: true,
            },
          },
        },
      });

      res.json({
        shops,
        meta: {
          total: totalShops,
          count: shops.length,
          offset: req.query.offset ? parseInt(req.query.offset) : 0,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Something went wrong" });
    }
  },
];

export const post = [
  verifyAuth,
  async (req, res) => {
    try {
      const shop = await prisma.shop.create({
        data: {
          name: req.body.name,
          address: req.body.address,
          phone: req.body.phone,
          email: req.body.email,
          description: req.body.description,
          imageUrl: req.body.imageUrl,
          users: {
            create: {
              userId: req.user.id,
            },
          },
        },
        select: SHOP_SELECT,
      });

      await prisma.logs.create({
        data: {
          type: LogType.SHOP_CREATED,
          userId: req.user.id,
          shopId: shop.id,
          to: JSON.stringify(shop),
        },
      });

      const shops = await prisma.shop.findMany({
        where: {
          users: {
            some: {
              userId: req.user.id,
            },
          },
        },
        select: SHOP_SELECT,
        take: req.query.limit ? parseInt(req.query.limit) : 20,
        skip: req.query.offset ? parseInt(req.query.offset) : 0,
      });

      const totalShops = await prisma.shop.count({
        where: {
          users: {
            some: {
              userId: req.user.id,
            },
          },
        },
      });

      res.json({
        newShop: shop,
        shops,
        meta: {
          total: totalShops,
          count: shops.length,
          offset: req.query.offset ? parseInt(req.query.offset) : 0,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Something went wrong" });
    }
  },
];
