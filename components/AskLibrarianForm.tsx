"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const askLibrarianSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  requestType: z.enum([
    "reference",
    "search-assistance",
    "document-access",
    "research-consultation",
  ]),
  preferredResponse: z.enum(["email", "phone", "in-person"]),
  question: z.string().trim().min(1, "Please describe your question"),
});

type AskLibrarianValues = z.infer<typeof askLibrarianSchema>;

export function AskLibrarianForm() {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AskLibrarianValues>({
    resolver: zodResolver(askLibrarianSchema),
    defaultValues: {
      requestType: "reference",
      preferredResponse: "email",
    },
  });

  const onSubmit = async (values: AskLibrarianValues) => {
    // Demo submission only — no backend wiring, matches the design prototype.
    await new Promise((resolve) => setTimeout(resolve, 400));
    toast.success("Your request has been submitted. LIA librarians will follow up soon.");
    reset({
      name: "",
      email: "",
      requestType: "reference",
      preferredResponse: "email",
      question: "",
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <Label htmlFor="name" className="text-foreground/80">Name</Label>
          <Input id="name" className="mt-1.5" {...register("name")} />
          {errors.name && (
            <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="email" className="text-foreground/80">Email</Label>
          <Input id="email" type="email" className="mt-1.5" {...register("email")} />
          {errors.email && (
            <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <Label className="text-foreground/80">Request type</Label>
          <Select
            value={watch("requestType")}
            onValueChange={(v) => setValue("requestType", v as AskLibrarianValues["requestType"])}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reference">Reference question</SelectItem>
              <SelectItem value="search-assistance">Search assistance</SelectItem>
              <SelectItem value="document-access">Document access</SelectItem>
              <SelectItem value="research-consultation">Research consultation</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-foreground/80">Preferred response</Label>
          <Select
            value={watch("preferredResponse")}
            onValueChange={(v) => setValue("preferredResponse", v as AskLibrarianValues["preferredResponse"])}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="in-person">In-person</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="question" className="text-foreground/80">Your question</Label>
        <Textarea
          id="question"
          rows={5}
          className="mt-1.5"
          placeholder="Describe what you're looking for…"
          {...register("question")}
        />
        {errors.question && (
          <p className="mt-1 text-xs text-rose-600">{errors.question.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto text-white"
        style={{ background: "linear-gradient(135deg, var(--saffron), var(--saffron-deep))" }}
      >
        <Send className="w-4 h-4 mr-2" />
        {isSubmitting ? "Sending…" : "Submit request"}
      </Button>
    </form>
  );
}

export default AskLibrarianForm;
