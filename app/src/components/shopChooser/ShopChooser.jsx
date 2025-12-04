import React from "react";
import { useShops } from "../../hooks/useShops";
import { Util, Spinner } from "tabler-react-2";
import { SimpleShopCard } from "../../components/shopcard/SimpleShopCard";

export const ShopChooser = () => {
    const {
    shops,
    loading,
    } = useShops();

    return (
        <div>
            {loading ? (
                <Spinner />
            ) : (
            <>
            <Util.Spacer size={1} />
            {shops.map((shop) => (
                <SimpleShopCard key={shop.id} shop={shop}/>
            ))}
            </>
            )}
        </div>
    );
}