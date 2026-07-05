"use client";
import Navbar from "@/components/landing/navbar";
import React from "react";
import HeroSection from "@/components/landing/sections/herosection";
import Bento from "@/components/landing/sections/bento";
import Testimonials from "@/components/landing/sections/testimonials";
import Pricing from "@/components/landing/sections/pricing";
import Faq from "@/components/landing/sections/faq";
import Footer from "@/components/landing/sections/footer";
import VideoToAsciiStudio from "@/components/video-to-ascii-studio";
import Cd from "@/components/cd";

const Page = () => {
  return (
    <div className=" flex flex-col justify-center items-center min-h-screen w-full relative font-satoshi ">
      <VideoToAsciiStudio />
    </div>
  );
};

export default Page;
