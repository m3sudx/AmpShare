   export interface Rating {
     average: number | null;
     count: number;
   }

   export interface Review {
     id: string;
     bookingId: string;
     chargerId: string;
     rating: number;
     comment: string | null;
     createdAt: string;
     reviewerName: string;
   }

   export interface ReviewSummary extends Rating {
     distribution: Record<1 | 2 | 3 | 4 | 5, number>;
   }