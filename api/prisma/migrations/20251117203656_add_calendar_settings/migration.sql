-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "calendarEndHour" INTEGER DEFAULT 24,
ADD COLUMN     "calendarIncrement" INTEGER DEFAULT 30,
ADD COLUMN     "calendarStartHour" INTEGER DEFAULT 6;
