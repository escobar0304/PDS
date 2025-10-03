/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

interface CategoryCardProps {
  title: string;
  description: string;
  image: string;
  link: string;
}

export default function CategoryCard({
  title,
  description,
  image,
  link,
}: CategoryCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      <img src={image} alt={title} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600 mb-3">{description}</p>
        <Link
          href={link}
          className="inline-block text-pink-500 font-medium hover:underline"
        >
          Ver mais →
        </Link>
      </div>
    </div>
  );
}
