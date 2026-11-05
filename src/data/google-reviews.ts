
export type GoogleReview = {
  id: string;
  name: string;
  rating: number;
  date: string;
  text: string;
};

export const googleReviews: GoogleReview[] = [
  {
    id: "suzanne-dunkley",
    name: "Suzanne Dunkley",
    rating: 5,
    date: "2 months ago",
    text: "I recently bought my beautiful Mini Cooper from here. I was delighted with the excellent service I received from Maurice and his team. thank you",
  },
  {
    id: "caitlyn-batterbury",
    name: "Caitlyn Batterbury",
    rating: 5,
    date: "1 month ago",
    text: "These guys helped my dad get approved for a new car he was able to be approved alot more then ever expected he car drives great ticks 1000 boxes very helpful right from the start of all the process even after first finance company didnt approve they still went on the find another lender to get the loan amazing",
  },
  {
    id: "emilyrose-gulland",
    name: "Emilyrose Gulland",
    rating: 5,
    date: "3 months ago",
    text: "Had a lovely time buying my dream car from this dealership! Staff were all super lovely and helpful! Neil who was helping me was really nice, lovely and transparent about everything!",
  },
  {
    id: "sara-viola",
    name: "Sara Viola",
    rating: 5,
    date: "2 months ago",
    text: "We had a great experience at Carmart Perth! The team was professional, friendly, and very understanding throughout the whole process. They helped us find the perfect car for our needs",
  },
  {
    id: "brenden-price",
    name: "Brenden Price",
    rating: 5,
    date: "1 day ago",
    text: "💯 professional and friendly ezy to deal with my 4x4 was nicely presented 🎀 & all of them gentle Men 👍🏽👍🏽",
  },
];

export const googleReviewSummary = {
  rating: null as number | null,
  totalReviews: null as number | null,
  googleUrl: "",
};
