const { PrismaClient } = require('@prisma/client')
console.log('PrismaClient export type:', typeof PrismaClient)
console.log('PrismaClient export:', PrismaClient)
try {
  const prisma = new PrismaClient({
    datasource: {
      url: 'file:./dev.db'
    }
  })
  console.log('Successfully created Prisma instance')
} catch (e) {
  console.error('Failed to create Prisma instance:', e)
}
