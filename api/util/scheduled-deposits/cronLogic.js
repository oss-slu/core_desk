const { prisma } = require('#prisma'); 

const createAutomatedLedgerPost = async ({ type, value, postItemType }) => {
  try {
    const ledgerItem = await prisma.ledgerItem.create({
      data: 
      {
        type,
        automatedLedgerPostItemValue: value,
        automatedLedgerPostItemType: postItemType,
      },
    });
    console.log(`${type} completed:`, ledgerItem);
  } catch (error) {
    console.error(`Error performing ${type.toLowerCase()}:`, error);
  }
};

const performAutomatedDeposits = async () => {
 await createAutomatedLedgerPost({
    type: 'AUTOMATED_DEPOSIT',
    automatedLedgerPostItemValue: 100.0, //default value, for now
    automatedLedgerPostItemType: 'DEPOSIT',
  });
};

const performAutomatedTopUp = async () => {
  await createAutomatedLedgerPost({
    const topUpData = {
      type: 'AUTOMATED_TOPUP',
      automatedLedgerPostItemValue: 50.0, //default value, for now
      automatedLedgerPostItemType: 'TOPUP',
  });
};

module.exports = { performAutomatedDeposits, performAutomatedTopUp };

