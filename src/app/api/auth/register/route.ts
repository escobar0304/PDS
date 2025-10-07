// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { hash } from 'argon2';
import connectDB from '@/lib/db';
import { User } from '@/lib/models';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validação
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password deve ter no mínimo 6 caracteres' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verificar se user já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está registado' },
        { status: 400 }
      );
    }

    // Hash da password com Argon2id
    const hashedPassword = await hash(password, { type: 2 }); // 2 = argon2id

    // Criar user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'USER',
      emailVerified: false,
    });

    // Retornar user sem password
    return NextResponse.json(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        message: 'Conta criada com sucesso!',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao registar utilizador:', error);
    return NextResponse.json(
      { error: 'Erro ao criar conta' },
      { status: 500 }
    );
  }
}
