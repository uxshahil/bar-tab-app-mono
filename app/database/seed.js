/* eslint-env node */
import { execSync } from 'child_process';
import { fakerAF_ZA as faker } from '@faker-js/faker';
import { createClient } from '@supabase/supabase-js'
import slugify from 'slugify';

const toSlug = (text) => {
  return slugify(text, {
    lower: true, // convert to lower case (defaults to false in this specific library, true for others)
    strict: true, // strip special characters except replacement
    remove: /[*+~.()'"!:@]/g,
    replacement: '-'
  })
}

// Run the bash script before seeding
console.log('📥 Fetching cocktail data from API...');
try {
  execSync('bash database/prefetch-api-data.sh', { stdio: 'inherit' });
  console.log('✅ Cocktail data fetched successfully!');
} catch (error) {
  console.error('❌ Failed to fetch cocktail data:', error.message);
  process.exit(1);
}

// Now proceed with your existing seed logic
console.log('🌱 Starting database seed...');

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SERVICE_ROLE_KEY
)

const testingUserEmail = process.env.TESTING_USER_EMAIL
if (!testingUserEmail) {
  console.error('Have you forgot to add TESTING_USER_EMAIL to your .env file?')
  process.exit()
}

const logErrorAndExit = (tableName, error) => {
  console.error(
    `An error occurred in table '${tableName}' with code ${error.code}: ${error.message}`
  )
  process.exit(1)
}

const logStep = (stepMessage) => {
  console.log(stepMessage)
}

const PrimaryTestUserExists = async () => {
  logStep('Checking if primary test user exists...')
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', 'testaccount1')
    .single()

  if (error) {
    console.log('Primary test user not found. Will create one.')
    return false
  }

  logStep('Primary test user is found.')
  return data?.id
}

const createPrimaryTestUser = async () => {
  logStep('Creating primary test user...')
  const firstName = 'John'
  const lastName = 'Doe'
  const userName = 'johndoe19'
  const email = testingUserEmail
  const password = 'password'
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: firstName + ' ' + lastName,
        username: userName
      }
    }
  })

  if (error) {
    logErrorAndExit('Users', error)
  }

  if (data) {
    const userId = data.user.id
    const resp = await supabase.from('profile').insert({
      id: userId,
      full_name: firstName + ' ' + lastName,
      username: userName,
      bio: 'The main testing account',
      avatar_url: `https://i.pravatar.cc/150?u=${data.user.id}`,
      email: email,
      password: '',
      user_role: 'admin',
      pin: '111111'
    })

    logStep('Primary test user created successfully.')
    console.log(resp)
    return userId
  }
}

const seedBars = async (barNames) => {
  const bars = barNames.map((name) => {
    return { name: name, slug: toSlug(name) }
  })

  const testBar = { name: 'VueSchools', slug: toSlug('VueSchools') }

  const { data, error } = await supabase.from('bar').insert([testBar, ...bars]).select('id')

  if (error) return logErrorAndExit('Bars', error)

  logStep('Bars seeded successfully.')

  return data
}

const seedMenus = async (menuNames) => {
  const menus = menuNames.map((name) => {
    return { name: name, slug: toSlug(name), active: true }
  })

  const { data, error } = await supabase.from('menu').insert(menus).select('id, name')

  if (error) return logErrorAndExit('Menus', error)

  logStep('Menus seeded successfully.')

  return data
}

const seedBarMenus = async (barId, menuIdName) => {
  const barMenus = menuIdName.map((menu) => {
    return { bar_id: barId, menu_id: menu.id, menu_name: menu.name }
  })

  const { data, error } = await supabase.from('bar_menu').insert(barMenus)

  if (error) return logErrorAndExit('Bar Menus', error)
  logStep('Bar Menus seeded successfully.')

  return data
}

const seedDrinksCategories = async (drinkCategoryNames) => {
  const menuItemCategories = drinkCategoryNames.map(
    (name) => ({
      name: name,
      slug: toSlug(name),
      menu: 'Drinks',
      active: true,
    }))

  const { data, error } = await supabase.from('menu_item_category').insert(menuItemCategories).select('name')

  if (error) return logErrorAndExit('Drinks Category', error)

  logStep('Drinks Categories seeded successfully.')

  return data
}

const seedDrinksGlasses = async (glassNames) => {
  const menuItemGlasses = glassNames.map(
    (name) => ({
      name: name,
      slug: toSlug(name),
      active: true
    }))

  const { data, error } = await supabase.from('drinks_glass').insert(menuItemGlasses).select('name')

  if (error) return logErrorAndExit('Drinks Glasses', error)

  logStep('Drinks Glasses seeded successfully.')

  return data
}

const seedDrinksIngredients = async (ingredientNames) => {
  const menuItemIngredients = ingredientNames.map(
    (name) => ({
      name: name,
      slug: toSlug(name),
      active: true
    }))

  const { data, error } = await supabase.from('menu_item_ingredient').insert(menuItemIngredients).select('name')

  if (error) return logErrorAndExit('Drink Ingredients', error)

  logStep('Drink Ingredients seeded successfully.')

  return data
}

const seedDrinks = async (drinks) => {
  const menuItems = drinks.map(
    (drink) => ({
      id: drink.idDrink,
      name: drink.strDrink,
      slug: toSlug(drink.strDrink),
      thumb_url: drink.strDrinkThumb,
      category: drink.strCategory,
      active: true,
      price: faker.number.float({ multipleOf: 0.25, min: 25, max: 75 })
    }))

  const { data, error } = await supabase.from('menu_item').insert(menuItems).select('id')

  if (error) return logErrorAndExit('Drinks', error)

  logStep('Drinks seeded successfully.')

  return data
}

const seedDatabase = async () => {
  let userId
  const testUserId = await PrimaryTestUserExists()

  if (!testUserId) {
    const primaryTestUserId = await createPrimaryTestUser()
    userId = primaryTestUserId
  } else {
    userId = testUserId
  }

  console.log(`✅ Using test user with ID: ${userId}`);
  console.log(`⚠️ TODO: insert test user ID into any tables that require it!`);

  const barNames = ['Doppio Zero', 'Orez Oippod'];
  const menuNames = ['Drinks', 'Food'];
  const barIds = await seedBars(barNames);
  const menuIdNames = await seedMenus(menuNames, barIds);
  await seedBarMenus(barIds[barIds.length - 1].id, menuIdNames.map(m => ({ id: m.id, name: m.name })));

  const apiGlasses = await import('../api_data/glass.json', { with: { type: 'json' } });
  const apiCategories = await import('../api_data/menu_category.json', { with: { type: 'json' } });
  const apiIngredients = await import('../api_data/ingredient.json', { with: { type: 'json' } });
  const apiDrinks = await import('../api_data/all_drinks.json', { with: { type: 'json' } });

  const drinksCategoryNames = apiCategories.default.drinks.map(c => c.strCategory);
  await seedDrinksCategories(drinksCategoryNames)

  const drinksGlassNames = apiGlasses.default.drinks.map(g => g.strGlass);
  await seedDrinksGlasses(drinksGlassNames)

  const drinksIngredientNames = apiIngredients.default.drinks.map(i => i.strIngredient1);
  await seedDrinksIngredients(drinksIngredientNames)

  const { drinks } = apiDrinks.default;
  await seedDrinks(drinks);
}

await seedDatabase();