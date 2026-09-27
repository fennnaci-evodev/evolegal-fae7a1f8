export type PlanTier = "free" | "basic" | "pro" | "premium";

export interface ProductPlan {
  id: PlanTier;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

export const PRODUCT_PLANS: ProductPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "",
    description: "Core analysis access",
    features: [
      "Unlimited general chat with Hugo",
      "2 precise analyses / day",
      "Core articles and guides",
      "Generic document templates",
    ],
    cta: "Activate Free",
    highlighted: false,
  },
  {
    id: "basic",
    name: "Basic",
    price: "$24",
    period: "/mo",
    description: "For recurring contract review",
    features: [
      "Unlimited general chat with Hugo",
      "15 precise analyses / day",
      "Full article and video library",
      "Expert review target: about 8 hours",
    ],
    cta: "Select Basic",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$59",
    period: "/mo",
    description: "For high-volume analysis",
    features: [
      "Unlimited general chat with Hugo",
      "60 precise analyses / day",
      "Full article and video library",
      "Expert review target: about 4 hours",
    ],
    cta: "Select Pro",
    highlighted: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$99",
    period: "/mo",
    description: "Unlimited analysis capacity",
    features: [
      "Unlimited general chat with Hugo",
      "Unlimited precise analyses",
      "Full article and video library",
      "Highest-priority expert review",
    ],
    cta: "Select Premium",
    highlighted: false,
  },
];

export const CREDIT_PACKS = [
  { credits: 20, price: "$9" },
  { credits: 50, price: "$19" },
  { credits: 100, price: "$35" },
  { credits: 250, price: "$79", bestValue: true },
];

export const EXPERT_REVIEW_EXPECTATION =
  "Typical expert-review turnaround is about 8 hours for Basic and about 4 hours for Pro. Premium requests receive highest priority; all times remain subject to matter complexity.";