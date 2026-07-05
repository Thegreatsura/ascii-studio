"use client";
import Navbar from "@/tool/components/landing/navbar";
import React from "react";
import HeroSection from "@/tool/components/landing/sections/herosection";
import Bento from "@/tool/components/landing/sections/bento";
import Testimonials from "@/tool/components/landing/sections/testimonials";
import Pricing from "@/tool/components/landing/sections/pricing";
import Faq from "@/tool/components/landing/sections/faq";
import Footer from "@/tool/components/landing/sections/footer";
import VideoToAsciiStudio from "@/tool/components/video-to-ascii-studio";
import Cd from "@/tool/components/cd";

const Page = () => {
  return (
    <div className=" flex flex-col justify-center items-center min-h-screen w-full relative font-satoshi ">
      <VideoToAsciiStudio />
    </div>
  );
};

export default Page;
