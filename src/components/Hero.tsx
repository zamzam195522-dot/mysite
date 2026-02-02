import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative w-full h-screen min-h-[600px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/zamzam-hero-logo.png"
          alt="ZamZam Industries Private Limited"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Wave Decoration */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-20"
        >
          <path
            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
