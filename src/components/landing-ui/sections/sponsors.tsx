import Link from "next/link";

const Sponsors = () => {
  return (
    <div className="flex flex-col text-center justify-center items-center">
      <div
        className="landing-content-width relative overflow-hidden p-4 sm:p-8"
        style={{
          background:
            "radial-gradient(115.89% 115.89% at 106.5% -23.2%, #79A4FF 0%, #EAF1FF 100%)",
          borderRadius: "20px",
        }}
      >
        <img
          className="pointer-events-none opacity-20 absolute inset-0 h-full w-full object-cover"
          src="/textures/box.png"
          alt=""
          aria-hidden="true"
        />
        <div className="relative z-10 flex flex-col-reverse md:flex-row items-center justify-between gap-4 sm:gap-8 text-left">
          <div className="flex flex-col gap-2 sm:gap-4 items-start w-full md:max-w-[60%]">
            <div className="text-xl sm:text-2xl md:text-4xl font-medium">
              Powered by Vercel
            </div>
            <div className="text-sm sm:text-base text-muted-foreground">
              Ascii Studio is proudly hosted on Vercel, bringing fast, global
              delivery to every ASCII frame we render.
            </div>
          </div>
          <Link
            href="https://vercel.com/?utm_source=ascii-studio&utm_campaign=oss"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Vercel"
            className="shrink-0 transition-opacity duration-200 hover:opacity-80"
          >
            <svg
              className="w-16 sm:w-20 md:w-24 h-auto drop-shadow-sm"
              viewBox="0 0 256 222"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid"
              aria-label="Vercel"



              role="img"
            >




              
              <path fill="#fff" d="m128 0 128 221.705H0z" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sponsors;
