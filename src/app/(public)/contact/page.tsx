"use client";
import type { Metadata } from "next";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Message sent! We'll get back to you within 24 hours.");
    setLoading(false);
    (e.target as HTMLFormElement).reset();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Contact Us</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400">Have a question? We're here to help.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Contact Info */}
        <div className="space-y-8">
          {[
            { icon: Mail, label: "Email", value: "support@rmdcprep.rw" },
            { icon: Phone, label: "Phone", value: "+250 788 000 000" },
            { icon: MapPin, label: "Location", value: "Kigali, Rwanda" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{label}</div>
                <div className="text-gray-500 dark:text-gray-400">{value}</div>
              </div>
            </div>
          ))}

          <a
            href="https://wa.me/250788000000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            Chat on WhatsApp
          </a>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Your Name" name="name" required placeholder="Enter your name" />
          <Input label="Email Address" name="email" type="email" required placeholder="you@example.com" />
          <Input label="Subject" name="subject" required placeholder="What is this about?" />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
            <textarea
              name="message"
              required
              rows={5}
              placeholder="Tell us how we can help..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
            />
          </div>
          <Button type="submit" loading={loading} className="w-full">
            Send Message
          </Button>
        </form>
      </div>
    </div>
  );
}
