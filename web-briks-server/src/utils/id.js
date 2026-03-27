// Generate a unique 6-digit string id (as required)
async function generateUserId(prisma) {
  for (let i = 0; i < 5; i++) {
    const candidate = String(Math.floor(100000 + Math.random() * 900000));
    const exists = await prisma.user.findUnique({ where: { id: candidate } });
    if (!exists) return candidate;
  }
  // rare collision runoff
  return String(Math.floor(100000 + Math.random() * 900000));
}

module.exports = { generateUserId };
