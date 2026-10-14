'use strict';

require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const MENU_ITEMS = [
  { name: 'Стейк Рибай', price: 2890, category: 'Основные', imageUrl: '/dish-ribeye.jpg', rating: 4.9, prepTime: 25, description: 'Мраморная говядина с овощами гриль', tag: 'Хит' },
  { name: 'Тартар из тунца', price: 1450, category: 'Закуски', imageUrl: '/dish-tartar.jpg', rating: 4.8, prepTime: 15, description: 'Свежий тунец с авокадо и соусом', tag: 'Новинка' },
  { name: 'Паста Карбонара', price: 890, category: 'Основные', imageUrl: '/dish-carbonara.jpg', rating: 4.7, prepTime: 20, description: 'Классическая итальянская паста', tag: null },
  { name: 'Тирамису', price: 590, category: 'Десерты', imageUrl: '/dish-tiramisu.jpg', rating: 4.9, prepTime: 5, description: 'Итальянский десерт с маскарпоне', tag: 'Популярное' },
  { name: 'Филе лосося', price: 1650, category: 'Основные', imageUrl: '/dish-salmon.jpg', rating: 4.8, prepTime: 25, description: 'С запечённой спаржей и лимоном', tag: null },
  { name: 'Бургер Look', price: 1190, category: 'Основные', imageUrl: '/dish-burger.jpg', rating: 4.7, prepTime: 20, description: 'Премиум бургер с трюфельным соусом', tag: 'Хит' },
  { name: 'Ризотто с морепродуктами', price: 1390, category: 'Основные', imageUrl: '/dish-risotto.jpg', rating: 4.6, prepTime: 30, description: 'Итальянское ризотто с креветками', tag: null },
  { name: 'Шоколадный фондан', price: 650, category: 'Десерты', imageUrl: '/dish-lava.jpg', rating: 4.9, prepTime: 15, description: 'Тёплый торт с жидким центром', tag: 'Маст хэв' },
  { name: 'Капрезе', price: 550, category: 'Салаты', imageUrl: '/dish-caprese.jpg', rating: 4.5, prepTime: 10, description: 'Классический итальянский салат', tag: null },
  { name: 'Цезарь с курицей', price: 750, category: 'Салаты', imageUrl: '/dish-caesar.jpg', rating: 4.6, prepTime: 15, description: 'Свежий салат с пармезаном', tag: null },
  { name: 'Брускетты', price: 450, category: 'Закуски', imageUrl: '/dish-bruschetta.jpg', rating: 4.5, prepTime: 10, description: 'С томатами и базиликом', tag: null },
  { name: 'Телячьи щечки', price: 1890, category: 'Основные', imageUrl: '/dish-cheeks.jpg', rating: 4.9, prepTime: 40, description: 'Томленые в красном вине с пюре из батата', tag: 'Выбор шефа' },
  { name: 'Салат Нисуаз', price: 890, category: 'Салаты', imageUrl: '/dish-nicoise.jpg', rating: 4.6, prepTime: 15, description: 'С тунцом на гриле и перепелиным яйцом', tag: null },
  { name: 'Крем-суп из тыквы', price: 650, category: 'Закуски', imageUrl: '/dish-soup.jpg', rating: 4.7, prepTime: 10, description: 'С кокосовым молоком и семечками', tag: 'Веган' },
  { name: 'Морской гребешок', price: 1150, category: 'Закуски', imageUrl: '/dish-scallop.jpg', rating: 4.8, prepTime: 15, description: 'С пюре из зеленого горошка', tag: 'Нежное' },
  { name: 'Меренговый рулет', price: 550, category: 'Десерты', imageUrl: '/dish-meringue.jpg', rating: 4.9, prepTime: 5, description: 'С фисташками и свежей малиной', tag: 'Хит' },
  { name: 'Сырное плато', price: 1450, category: 'Закуски', imageUrl: '/dish-cheese.jpg', rating: 4.5, prepTime: 10, description: 'Отборные фермерские сыры с медом', tag: null },
  { name: 'Панна-котта', price: 490, category: 'Десерты', imageUrl: '/dish-pannacotta.jpg', rating: 4.6, prepTime: 5, description: 'С соусом из спелых ягод', tag: null },
];

const PROMO_CODES = [
  { code: 'LOOK20', discount: 20, description: 'Скидка 20% на первый заказ', isActive: true },
  { code: 'LOOK15', discount: 15, description: 'Скидка 15% за пасхалку', isActive: true },
  { code: 'LOOKRUN', discount: 10, description: 'Скидка 10% за победу в мини-игре «Спринт шефа»', isActive: true },
];

async function main() {
  const count = await prisma.menuItem.count();
  if (count === 0) {
    await prisma.menuItem.createMany({ data: MENU_ITEMS });
    console.log(`Меню заполнено: ${MENU_ITEMS.length} блюд.`);
  } else {
    console.log(`Меню уже заполнено (${count} позиций), пропускаем.`);
  }

  for (const promo of PROMO_CODES) {
    await prisma.promoCode.upsert({
      where: { code: promo.code },
      update: {},
      create: promo,
    });
  }
  console.log(`Промокоды засеяны (${PROMO_CODES.length}).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
