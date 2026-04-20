INSERT INTO "user" (id,email,"firstName","lastName",admin,suspended,simple,"createdAt","updatedAt")
VALUES ('51882c2c-2cb3-49b6-882d-a2d9bf9ee9af','user@coredesk-test.slu.edu','Test','User',false,false,false,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "user" (id,email,"firstName","lastName",admin,suspended,simple,"createdAt","updatedAt")
VALUES ('51882c2c-23b3-49b6-882d-a2d9bf9ee9af','admin@coredesk-test.slu.edu','Test','Admin',true,false,false,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);



INSERT INTO "Shop" (id,name,color,"createdAt","updatedAt")
VALUES ('22222222-2222-2222-2222-222222222222','E2E Simplified Shop','BLUE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);



INSERT INTO "UserShop" (id,"userId","shopId","accountType",active,blacklisted,"createdAt","updatedAt")
VALUES ('33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','CUSTOMER',true,false,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);


INSERT INTO "ResourceType" (id,title,"shopId","createdAt","updatedAt")
VALUES ('44444444-4444-4444-4444-444444444444','FDM 3D Printer','22222222-2222-2222-2222-222222222222',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);


INSERT INTO "Material" (id,title,manufacturer,"shopId","resourceTypeId","createdAt","updatedAt")
VALUES ('55555555-5555-5555-5555-555555555555','PLA','Generic','22222222-2222-2222-2222-222222222222','44444444-4444-4444-4444-444444444444',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);


INSERT INTO "Resource" (id,title,"shopId","resourceTypeId","createdAt","updatedAt")
VALUES ('66666666-6666-6666-6666-666666666666','Lab X1C','22222222-2222-2222-2222-222222222222','44444444-4444-4444-4444-444444444444',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);