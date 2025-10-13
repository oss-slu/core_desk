import React from "react";
import { useShops } from "../../hooks/useShops";
import { Util } from "tabler-react-2";
import { ShopCard } from "../../components/shopcard/ShopCard";
import { Page } from "#page";

export const ShopChooser = () => {
    const {
    shops,
    createModalElement
    } = useShops();

    return (
        <Page>
            <Util.Spacer size={1} />
            {shops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
            ))}
        </Page>
    );
}