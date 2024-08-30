import { PaymentsProductsGetResponse, Price, Product } from "@cloudy/utils/common";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { stripe } from "../../utils/stripe";

export const dynamic = "force-dynamic";

export const GET = async () => {
	const products = await stripe.products.list();

	const activeProducts = products.data.flatMap(product => {
		if (product.active && product.type === "service") {
			return [product];
		}
		return [];
	});

	const productsWithPricing = await Promise.all(
		activeProducts.map(async product => {
			const defaultPriceResult = await stripe.prices.retrieve(product.default_price as string);
			const defaultPrice = transformPrice(defaultPriceResult);

			const fullPriceResult = await stripe.prices.search({
				query: `product:"${product.id}" AND active:"true" AND metadata["type"]:"full_price"`,
			});

			const fullPriceItem = fullPriceResult.data.at(0);
			const fullPrice = fullPriceItem ? transformPrice(fullPriceItem) : null;

			return {
				id: product.id,
				name: product.name,
				description: product.description,
				defaultPrice,
				fullPrice,
				marketingFeatures: product.marketing_features?.map(feature => ({
					title: feature.name!,
				})),
				metadata: product.metadata,
			} satisfies Product;
		}),
	);

	return NextResponse.json({
		products: productsWithPricing,
	} satisfies PaymentsProductsGetResponse);
};

const transformPrice = (price: Stripe.Price): Price => {
	return {
		id: price.id,
		active: price.active,
		currency: price.currency,
		metadata: price.metadata,
		product: price.product.toString(),
		recurring: price.recurring
			? {
					interval: price.recurring.interval,
			  }
			: null,
		unit_amount: price.unit_amount,
	};
};
