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
    image: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=800&h=600&fit=crop',
    order: 1
  },
  {
    name: 'Colares em Aço e Pedra',
    slug: 'colares-aco-pedra',
    description: 'Colares elegantes combinando aço inoxidável com pedras preciosas, perfeitos para o dia a dia.',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
    order: 2
  },
  {
    name: 'Japamalas',
    slug: 'japamalas',
    description: 'Japamalas tradicionais com pedras naturais, ideais para meditação e práticas espirituais.',
    image: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=800&h=600&fit=crop',
    order: 3
  },
  {
    name: 'Pulseiras em Aço e Pedra',
    slug: 'pulseiras-aco-pedra',
    description: 'Pulseiras versáteis que combinam o brilho do aço com a energia das pedras naturais.',
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=600&fit=crop',
    order: 4
  },
  {
    name: 'Anéis em Aço e Pedra',
    slug: 'aneis-aco-pedra',
    description: 'Anéis únicos que unem design contemporâneo com a beleza atemporal das pedras preciosas.',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&h=600&fit=crop',
    order: 5
  },
  {
    name: 'Decoração',
    slug: 'decoracao',
    description: 'Peças decorativas com cristais e pedras para energizar e embelezar o seu espaço.',
    image: 'https://images.unsplash.com/photo-1602524206684-76b089bd0b28?w=800&h=600&fit=crop',
    order: 6
  }
];

async function seed() {
  try {
    console.log('🌱 Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Limpar categorias existentes (cuidado em produção!)
    console.log('🗑️  Limpando categorias existentes...');
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