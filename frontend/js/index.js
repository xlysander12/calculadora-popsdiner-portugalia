stored_items= {"comidas": [], "bebidas": [], "menus-carne": [], "menus-peixe": [], "menus-carne-peixe": []};
items_adicionados = [];
discount = 0;

function get_api_url() {
    if (window.location.hostname.includes("portugalia.")) {
        return "/calculadora_popsdiner/api"
    } else {
        return "/portugalia/calculadora_popsdiner/api"
    }

}

async function load_items_from_db() {
    // Comidas
    let items = await fetch(`${get_api_url()}/categorias/comidas`, {method: "GET", headers: {"Accept": "application/json", "Content-Type": "application/json"}})
    stored_items.comidas = await items.json();

    // Bebidas
    items = await fetch(`${get_api_url()}/categorias/bebidas`, {method: "GET", headers: {"Accept": "application/json", "Content-Type": "application/json"}})
    stored_items.bebidas = await items.json();

    // Menus Carne
    items = await fetch(`${get_api_url()}/categorias/menus_carne`, {method: "GET", headers: {"Accept": "application/json", "Content-Type": "application/json"}})
    stored_items["menus-carne"] = await items.json();

    // Menus Peixe
    items = await fetch(`${get_api_url()}/categorias/menus_peixe`, {method: "GET", headers: {"Accept": "application/json", "Content-Type": "application/json"}})
    stored_items["menus-peixe"] = await items.json();

    // Menus Carne e Peixe
    items = await fetch(`${get_api_url()}/categorias/menus_carne_peixe`, {method: "GET", headers: {"Accept": "application/json", "Content-Type": "application/json"}})
    stored_items["menus-carne-peixe"] = await items.json();

    // When all finished, build the cards
    search_items("");
}

function build_item_card(parent_div, item) {
    // Create new element
    let card = document.createElement("div");
    card.className = "col card-group"
    card.innerHTML =
        `<div class="card articleCard">
            <div class="card-body">
                    <p>${item.nome}</p>
            </div>
            <div class="d-flex col-12 articleDetails px-3">
                <span class="col-auto d-flex justify-content-start align-self-center">
                    <i class="fas fa-euro-sign align-self-center"></i> 
                        <span class="text-success">${format_money(item.preço)}</span>
                </span>
            </div>
        </div>`;

    card.addEventListener("click", async () => {
        let item_query = await fetch(`${get_api_url()}/items/${item.id}`, {method: "GET", headers: {"Accept": "application/json", "Content-Type": "application/json"}});

        if (item_query.status !== 200) {
            return;
        }

        let item_json = await item_query.json();

        add_item_to_summary(item_json);
    });

    document.getElementById(parent_div).appendChild(card);
}

function search_items(search) {
    // Store categories names in list
    let categories = ["comidas", "bebidas", "menus-carne", "menus-peixe", "menus-carne-peixe"]

    // Empty all categories
    for (let i = 0; i < categories.length; i++) {
        document.getElementById(categories[i]).innerHTML = "";
    }

    // Search crimes by categories
    categories.forEach((category) => {
        stored_items[category].forEach((item) => {
            if (item.nome.toLowerCase().includes(search.toLowerCase())) {
                build_item_card(category, item);
            }
        });
    });

}

function add_item_to_summary(item) {
    let final_item = {item: item, amount: 1}
    items_adicionados.push(final_item);
    update_summary();
}

function remove_crime_from_summary(item) {
    items_adicionados = items_adicionados.filter((element) => element.item.id !== item);
    update_summary();
}

function clear_summary() {
    items_adicionados.length = 0;
    update_summary();
}

function copy_articles() {
    let articles = "";
    for (let i = 0; i < items_adicionados.length; i++) {
        // Remove text from inside [] brackets
        articles += items_adicionados[i].nome.replace(/\[.*?\]/g, "").trimEnd();

        if (i !== items_adicionados.length - 1) {
            articles += " | ";
        }

    }
    navigator.clipboard.writeText(articles).then(function() {
        alert("Artigos copiados para a área de transferência! (CTRL + V)");
    }, function() {
        alert("Não foi possível copiar os artigos!");
    });
}

function format_money(amount) {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function updateDiscount(new_discount) {
    discount = new_discount;
    update_summary();
}

function setItemAmount(item_id, amount) {
    for (let i = 0; i < items_adicionados.length; i++) {
        if (items_adicionados[i].item.id === item_id) {
            items_adicionados[i].amount = amount;
            break;
        }
    }

    update_summary();
}

function handleItemAmountChange(event) {
    setItemAmount()
}

function update_summary() {
    // Clean Summary
    document.getElementById("summary_whole_box").innerHTML =
        `<div id="summary_whole_box" class="card sticky-top-resume">
            <div class="card-header">
                <h1 class="text-center">Resumo da Venda</h1>
            </div>

            <div id="article_list" class="card-body articleList">
                <p class="text-center"><small>Ainda não foram adicionados artigos</small></p>
            </div>
        </div>`

    // If there are items added to summary show them
    if (items_adicionados.length > 0) {
        // Add Crimes to List
        let list = document.getElementById("article_list");
        list.innerHTML = "";

        for (let entry of items_adicionados) {
            let item = entry.item;
            let amount = entry.amount;

            list.innerHTML += `<div role="alert" class="col-12 alert alert-dark alert-fine d-flex p-1 px-3">
                    <div class="col-auto">
                        <div class="row" style="width: 20rem"><small style="word-wrap: break-word">${item.nome}</small></div>
                        <div class="row text-article">
                            <small>
                                <div style="color: lightgray">
                                    <span><i class="fas fa-euro-sign align-self-center"></i>&nbsp;${format_money(item.preço)}</span>
                                </div>
                            </small>
                        </div>
                    </div>
                    <div class="col align-items-center d-flex justify-content-end">
                        <input id='item${item.id}' type="number" min="1" value='${amount}' class="align-middle" style="max-width: 40px; background: transparent" onchange='setItemAmount(${item.id}, this.value)'/>
                        <a class="text-danger align-middle"><i class="fa fa-times alert-close" onclick='remove_crime_from_summary(${item.id})'></i></a>
                    </div>
                </div>`;
        }




        // Do the maths
        let total_price = 0
        for (let i = 0; i < items_adicionados.length; i++) {
            total_price += items_adicionados[i].item.preço * items_adicionados[i].amount;
        }

        let price_discount = 0;
        for (let i = 0; i < items_adicionados.length; i++) {
            if (items_adicionados[i].descontável === 0) {
                price_discount += items_adicionados[i].item.preço;
                continue;
            }

            // Calculate the discount
            let discounted = items_adicionados[i].item.preço * (discount / 100);

            // Apply the discount to every instance of the item
            price_discount += (items_adicionados[i].item.preço - discounted) * items_adicionados[i].amount;
        }

        // Add Summary maths
        document.getElementById("summary_whole_box").innerHTML +=
            `<div class="card-footer articleSums">
                <div class="row">
                    <h5>Preço Bruto: ${format_money(total_price)} €</h5>
                    
                    <label>
                        <input type="radio" id="nodiscount" name="discounttype" value=0>
                        Sem desconto
                    </label>
                    
                    <label>
                        <input type="radio" id="twentydiscount" name="discounttype" value=20>
                        20% desconto
                    </label>
                    
                    <label>
                        <input type="radio" id="thrityfivediscount" name="discounttype" value=35>
                        35% desconto
                    </label>
                    
                    <label>
                        <input type="radio" id="fiftydiscount" name="discounttype" value=50>
                        50% desconto
                    </label>
                    
                    <h5>Preço com Desconto: ${format_money(price_discount)} €</h5>
                </div>
            </div>`

        // Add Buttons
        document.getElementById("summary_whole_box").innerHTML +=
            `<div class="card-footer">
                <div class="d-grid gap-2 col-12 mx-auto">
                    <input type="text" id="workersname" placeholder="Nome do trabalhador" class="form-control form-control-summary" value=${localStorage.getItem("trabalhador") !== null ? localStorage.getItem("trabalhador"): ""}>
                
                    <button type="button" class="btn btn-outline-primary" onclick="copy_articles()">Validar Venda</button>
                    <button type="button" class="btn btn-outline-success" onclick="clear_summary()">Limpar</button>
                </div>
            </div>`

        // Check the discounts radio buttons
        if (discount === 0) {
            document.getElementById("nodiscount").checked = true;
        } else if (discount === 20) {
            document.getElementById("twentydiscount").checked = true;
        } else if (discount === 35) {
            document.getElementById("thrityfivediscount").checked = true;
        } else if (discount === 50) {
            document.getElementById("fiftydiscount").checked = true;
        }

        // Add event listeners to radio buttons
        document.getElementById("nodiscount").addEventListener("change", () => {
            updateDiscount(0);
        });
        document.getElementById("twentydiscount").addEventListener("change", () => {
            updateDiscount(20);
        });
        document.getElementById("thrityfivediscount").addEventListener("change", () => {
            updateDiscount(35);
        });
        document.getElementById("fiftydiscount").addEventListener("change", () => {
            updateDiscount(50);
        });
    }
}

function collapse_category(category, button) {
    document.getElementById(category).classList.toggle("collapse");

    if (document.getElementById(category).classList.contains("collapse")) {
        button.className = "fa fa-chevron-up alert-collapse";
    } else {
        button.className = "fa fa-chevron-down alert-collapse";
    }
}