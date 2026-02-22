export interface AccommodationOption {
    type: 'hotel' | 'airbnb' | 'hostel';
    name: string;
    pricePerNight: number;
    rating: number;
    amenities: string[];
    description: string;
    isRecommended?: boolean;
    recommendationReason?: string;
}

export async function getAccommodationOptions(
    destination: string,
    budgetType: string = 'moderate'
): Promise<AccommodationOption[]> {
    // Heuristic data based on destination and budget
    const basePrice = budgetType === 'budget' ? 800 : budgetType === 'luxury' ? 6000 : 2500;

    const options: AccommodationOption[] = [
        {
            type: 'hotel',
            name: `Grand ${destination} Residency`,
            pricePerNight: Math.round(basePrice * 1.2),
            rating: 4.5,
            amenities: ['Room Service', 'WiFi', 'Pool', 'Breakfast'],
            description: 'A premium hotel experience in the heart of the city.'
        },
        {
            type: 'airbnb',
            name: `Cozy Home Stay - ${destination} Heights`,
            pricePerNight: Math.round(basePrice * 0.9),
            rating: 4.8,
            amenities: ['Kitchen', 'Private Balcony', 'WiFi', 'Local Vibe'],
            description: 'Live like a local in this beautifully furnished apartment.'
        },
        {
            type: 'hostel',
            name: `The Nomad's Nest ${destination}`,
            pricePerNight: Math.round(basePrice * 0.4),
            rating: 4.2,
            amenities: ['Dorm beds', 'Common area', 'Gaming zone', 'Cafe'],
            description: 'Perfect for backpackers and social travelers.'
        }
    ];

    // Pick top recommended based on budgetType
    options.forEach(opt => {
        if (budgetType === 'budget' && opt.type === 'hostel') {
            opt.isRecommended = true;
            opt.recommendationReason = '🏆 Best for budget travelers';
        } else if (budgetType === 'luxury' && opt.type === 'hotel') {
            opt.isRecommended = true;
            opt.recommendationReason = '🏆 Premium luxury experience';
        } else if (budgetType === 'moderate' && opt.type === 'airbnb') {
            opt.isRecommended = true;
            opt.recommendationReason = '🏆 Best value & local experience';
        }
    });

    return options;
}
