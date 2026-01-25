sequenceDiagram
    autonumber
    actor U as User
    participant DS@{ "type": "boundary" } as <br/>dashboard_supplier.js<br/>(View)
    participant P@{ "type": "control" } as <br/>products.php<br/>(Controller)
    participant M@{ "type": "entity" } as <br/>products.php<br/>(Model)
    participant V@{ "type": "entity" } as <br/>variations.php<br/>(Model)
    participant DB@{ "type": "database" } as <br/>Database<br/>(Model)
    participant END@{ "type": "boundary" } as <br/>Page Create New Category


    U->>DS: Click create product
    DS->>DS: contructor()<br/>(capture event)

    activate DS
        Note over DS,DS: createNewProduct()
        DS-->>P: Send request Create Product
        P->>P: handleProduct()<br/>(route + validate)

        activate P
            Note over P,P: createNewProduct()
            P->>P: generate_sku()
            P->>M: setSku(sku)
            P->>M: setEmail(email)
            P->>M: create()
            M->>DB: INSERT products(...)
            DB-->>M: id/sku
            M-->>P: id/sku

            P->>V: Create default Variation
            activate V
                Note over V,V: createDefaultVariation()
                V->>DB: INSERT Variations(...)
                DB-->>V: sku_variation
                V-->>P: sku_variation
            deactivate V

            P-->>DS: success/sku/sku_variation
        deactivate P

        DS->>END: Open New page (sku/sku_variation)
        Note over END,END: (End of Sequence Diagram 1)<br/>(Success page loads with links using sku/sku_variation)<br/>(Next: Sequence Diagram 2)
    deactivate DS
