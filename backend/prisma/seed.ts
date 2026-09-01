import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { id: 'bowls', name: 'Signature Bowls', icon: '🍲' },
  { id: 'rice', name: 'Rice Meals', icon: '🍚' },
  { id: 'wraps', name: 'Wraps', icon: '🌯' },
  { id: 'salads', name: 'Fresh & Healthy', icon: '🥗' },
  { id: 'sides', name: 'Sides', icon: '🍟' },
  { id: 'drinks', name: 'Drinks', icon: '🥤' },
];

const foodImages = {
  chickenBowl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85',
  paneerBowl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85',
  chickenRice: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=85',
  veggieWrap: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=85',
  salad: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=85',
  fries: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=85',
  lemonade: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=85',
  bbqBowl: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=900&q=85',
  falafelWrap: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=900&q=85',
  greekSalad: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=85',
  butterChickenRice: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=900&q=85',
  tofuTeriyaki: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=900&q=85',
  cheesyNacho: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=900&q=85',
  mangoShake: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=900&q=85',
  icedTea: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=900&q=85',
};

const products = [
  { id: 1, name: 'Golden Chicken Bowl', categoryId: 'bowls', price: 249, calories: 620, portion: '450g', rating: 4.8, imageUrl: foodImages.chickenBowl, description: 'Tender chicken, fragrant rice, fresh vegetables and our signature golden sauce.', ingredients: ['Chicken', 'Basmati rice', 'Vegetables', 'Golden sauce', 'Herbs'], available: true, veg: false, vegan: false, sugarFree: false },
  { id: 2, name: 'Paneer Power Bowl', categoryId: 'bowls', price: 229, calories: 560, portion: '420g', rating: 4.7, imageUrl: foodImages.paneerBowl, description: 'Grilled paneer with seasoned rice, greens and a creamy house dressing.', ingredients: ['Paneer', 'Rice', 'Lettuce', 'Corn', 'House dressing'], available: true, veg: true, vegan: false, sugarFree: true },
  { id: 3, name: 'Chicken Rice Feast', categoryId: 'rice', price: 279, calories: 710, portion: '500g', rating: 4.9, imageUrl: foodImages.chickenRice, description: 'A hearty rice meal with juicy chicken and aromatic spices.', ingredients: ['Chicken', 'Rice', 'Onion', 'Spices', 'Coriander'], available: true, veg: false, vegan: false, sugarFree: true },
  { id: 4, name: 'Veggie Crunch Wrap', categoryId: 'wraps', price: 179, calories: 430, portion: '280g', rating: 4.6, imageUrl: foodImages.veggieWrap, description: 'Crisp vegetables, seasoned filling and golden sauce wrapped fresh.', ingredients: ['Tortilla', 'Lettuce', 'Corn', 'Beans', 'Sauce'], available: true, veg: true, vegan: true, sugarFree: false },
  { id: 5, name: 'Green Garden Salad', categoryId: 'salads', price: 199, calories: 290, portion: '300g', rating: 4.5, imageUrl: foodImages.salad, description: 'Fresh greens, crunchy vegetables and a light citrus dressing.', ingredients: ['Lettuce', 'Cucumber', 'Tomato', 'Corn', 'Citrus dressing'], available: true, veg: true, vegan: true, sugarFree: true },
  { id: 6, name: 'Smokey BBQ Bowl', categoryId: 'bowls', price: 269, calories: 640, portion: '460g', rating: 4.8, imageUrl: foodImages.bbqBowl, description: 'Smokey BBQ glazed chicken with roasted corn, quinoa and avocado.', ingredients: ['BBQ Chicken', 'Quinoa', 'Roasted Corn', 'Avocado', 'Herbs'], available: true, veg: false, vegan: false, sugarFree: false },
  { id: 7, name: 'Crispy Falafel Wrap', categoryId: 'wraps', price: 189, calories: 410, portion: '290g', rating: 4.7, imageUrl: foodImages.falafelWrap, description: 'Golden falafel bites with hummus, pickled beets and tahini sauce.', ingredients: ['Falafel', 'Hummus', 'Tahini', 'Pickles', 'Tortilla'], available: true, veg: true, vegan: true, sugarFree: true },
  { id: 8, name: 'Butter Chicken Rice', categoryId: 'rice', price: 289, calories: 730, portion: '520g', rating: 4.9, imageUrl: foodImages.butterChickenRice, description: 'Rich creamy butter chicken served over fragrant jeera rice.', ingredients: ['Chicken', 'Butter gravy', 'Jeera rice', 'Cream'], available: true, veg: false, vegan: false, sugarFree: false },
  { id: 9, name: 'Tofu Teriyaki Bowl', categoryId: 'salads', price: 219, calories: 480, portion: '380g', rating: 4.6, imageUrl: foodImages.tofuTeriyaki, description: 'Seared tofu with edamame, purple cabbage and teriyaki glaze.', ingredients: ['Tofu', 'Edamame', 'Purple Cabbage', 'Teriyaki', 'Sesame'], available: true, veg: true, vegan: true, sugarFree: false },
  { id: 10, name: 'Greek Feta Salad', categoryId: 'salads', price: 209, calories: 310, portion: '320g', rating: 4.6, imageUrl: foodImages.greekSalad, description: 'Crumble feta, kalamata olives, crisp cucumbers and oregano dressing.', ingredients: ['Feta', 'Olives', 'Cucumber', 'Cherry tomato', 'Olive oil'], available: true, veg: true, vegan: false, sugarFree: true },
  { id: 11, name: 'Golden Fries', categoryId: 'sides', price: 119, calories: 360, portion: '180g', rating: 4.6, imageUrl: foodImages.fries, description: 'Crispy golden fries seasoned with our signature spice mix.', ingredients: ['Potato', 'Oil', 'Golden seasoning'], available: true, veg: true, vegan: true, sugarFree: false },
  { id: 12, name: 'Cheesy Nacho Bowl', categoryId: 'sides', price: 149, calories: 420, portion: '220g', rating: 4.7, imageUrl: foodImages.cheesyNacho, description: 'Tortilla chips topped with warm jalapeño cheese, salsa and sour cream.', ingredients: ['Nachos', 'Melted cheese', 'Salsa', 'Jalapeños'], available: true, veg: true, vegan: false, sugarFree: false },
  { id: 13, name: 'Classic Lemon Cooler', categoryId: 'drinks', price: 89, calories: 110, portion: '350ml', rating: 4.7, imageUrl: foodImages.lemonade, description: 'Refreshing lemon cooler served chilled.', ingredients: ['Lemon', 'Water', 'Mint', 'Sugar'], available: true, veg: true, vegan: true, sugarFree: false },
  { id: 14, name: 'Fresh Mango Shake', categoryId: 'drinks', price: 129, calories: 240, portion: '350ml', rating: 4.9, imageUrl: foodImages.mangoShake, description: 'Thick creamy Alphonso mango shake blended fresh.', ingredients: ['Mango pulp', 'Milk', 'Ice cream'], available: true, veg: true, vegan: false, sugarFree: false },
  { id: 15, name: 'Peach Iced Tea', categoryId: 'drinks', price: 99, calories: 130, portion: '350ml', rating: 4.7, imageUrl: foodImages.icedTea, description: 'Fresh brewed black tea infused with natural peach flavor.', ingredients: ['Brewed tea', 'Peach extract', 'Lemon', 'Ice'], available: true, veg: true, vegan: true, sugarFree: true },
];

async function main() {
  console.log('Seeding categories...');
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, icon: cat.icon },
      create: cat,
    });
  }

  console.log('Seeding products...');
  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    });
  }

  console.log('Resetting product primary key sequence...');
  await prisma.$executeRawUnsafe("SELECT setval('products_id_seq', (SELECT MAX(id) FROM products))");

  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
