SELECT table_name
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name IN (
    'internalPointAccounts',
    'internalPointLedgerEntries',
    'internalPointGrantRequests',
    'internalPointInvestmentUses',
    'internalPointConversionRequests',
    'bPointReserveAccounts',
    'bPointReserveMovements',
    'bPointWithdrawalRequests'
  )
ORDER BY table_name;
