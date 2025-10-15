import React from "react";
import { useShops } from "../../hooks/useShops";
import { Util } from "tabler-react-2";
import { SimpleShopCard } from "../../components/shopcard/SimpleShopCard";
import { Page } from "#page";

export const ShopChooser = () => {
    const {
    shops,
    } = useShops();

    return (
        <div>
            <Util.Spacer size={1} />
            {shops.map((shop) => (
                <SimpleShopCard key={shop.id} shop={shop}/>
            ))}
        </div>
    );
}