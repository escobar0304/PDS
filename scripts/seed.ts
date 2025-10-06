// scripts/seed.ts
// Execute com: npx tsx scripts/seed.ts

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI!;

// Schemas inline para o seed
const categorySchema = new mongoose.Schema({
  name: String,
  slug: String,
  description: String,
  image: String,
  order: Number
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

const categories = [
  {
    name: 'Cristais em Bruto',
    slug: 'cristais-em-bruto',
    description: 'Cristais e pedras preciosas na sua forma natural e bruta, mantendo toda a energia original da terra.',
    image: '/images/confianca.png',
    order: 1
  },
  {
    name: 'Colares em Aço e Pedra',
    slug: 'colares-aco-pedra',
    description: 'Colares elegantes combinando aço inoxidável com pedras preciosas, perfeitos para o dia a dia.',
    image: '/images/confianca.png',
    order: 2
  },
  {
    name: 'Japamalas',
    slug: 'japamalas',
    description: 'Japamalas tradicionais com pedras naturais, ideais para meditação e práticas espirituais.',
    image: '/images/confianca.png',
    order: 3
  },
  {
    name: 'Pulseiras em Aço e Pedra',
    slug: 'pulseiras-aco-pedra',
    description: 'Pulseiras versáteis que combinam o brilho do aço com a energia das pedras naturais.',
    image: '/images/confianca.png',
    order: 4
  },
  {
    name: 'Anéis em Aço e Pedra',
    slug: 'aneis-aco-pedra',
    description: 'Anéis únicos que unem design contemporâneo com a beleza atemporal das pedras preciosas.',
    image: '/images/confianca.png',
    order: 5
  },
  {
    name: 'Decoração',
    slug: 'decoracao',
    description: 'Peças decorativas com cristais e pedras para energizar e embelezar o seu espaço.',
    image: '/images/confianca.png',
    order: 6
  }
];

async function seed() {
  try {
    console.log(' Conectar ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log(' Conectado ao MongoDB');

    // Limpar categorias existentes (cuidado em produção!)
    console.log('🗑️  Limpar categorias existentes...');
    await Category.deleteMany({});

    // Inserir novas categorias
    console.log('📦 Inserindo categorias...');
    const insertedCategories = await Category.insertMany(categories);
    console.log(`✅ ${insertedCategories.length} categorias inseridas com sucesso!`);

    // Exibir categorias inseridas
    console.log('\n📋 Categorias criadas:');
    insertedCategories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.slug})`);
    });

    console.log('\n✨ Seed concluído com sucesso!');
    console.log('\n💡 Próximo passo: Adicionar produtos através do painel admin');
    
  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado do MongoDB');
    process.exit(0);
  }
}

seed();