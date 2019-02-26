// Variable
let initVerif = false;
let init = false; 
let selectedAddress = 0;
let listAddress = [];
let portPipe;

// Function utiliser pour call api
function httpGet(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    return xmlHttp.responseText;
}

// Return array of indice position 
function getIndicesOf(searchStr, str, caseSensitive) {
    var searchStrLen = searchStr.length;
    if (searchStrLen == 0) {
        return [];
    }
    var startIndex = 0, index, indices = [];
    if (!caseSensitive) {
        str = str.toLowerCase();
        searchStr = searchStr.toLowerCase();
    }
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}


// Return address type xrb_ or nano_
function GetAddressType(description)
{
    if(description.includes("xrb_"))
    {
        return "xrb_";
    }
    else if(description.includes("nano_"))
    {
        return "nano_";
    }
}

// Return true or false if real address // TODO call nano ninja to verify if address exists on the network
function DescriptionHasNanoAddress(description)
{
    return description.includes("xrb_") || description.includes("nano_"); 
}

// Syntax check for nano address
function IsFalseNanoAddress(address)
{
    var format = /[ !@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?]/;
    return format.test(address);
}

function DoesAddressExistOnNetwork(address)
{
    let url = "https://mynano.ninja/api/accounts/" + address + "/info";
    let resp = JSON.parse(httpGet(url));

    if(resp.error == "Bad account number")
    {
        return false;
    }

    return true;
}

// Return an array of nano adddress contained in the description 
function GetNanoAddress(description)
{
    let returnAddress = [];

    getIndicesOf("xrb_",description).forEach(function(indice)
    {

        let address =  description.substr(indice,64);
        if(!IsFalseNanoAddress(address))
        {
            returnAddress.push( address );
        }

    });

    getIndicesOf("nano_",description).forEach(function(indice)
    {

        let address =  description.substr(indice,65);
        if(!IsFalseNanoAddress(address))
        {
            returnAddress.push( address );
        }

    });
    
   // return returnAddress;
    return [... new Set(returnAddress)];
}

document.addEventListener('copy', function(e) {
    e.clipboardData.setData('text/plain', listAddress[selectedAddress]);
    e.preventDefault();
});

function CopyToClipboard()
{
    document.execCommand('copy');
}

function SendScrollMessage()
{
    portPipe.postMessage({address: listAddress[selectedAddress]});
}

function HandleAddressClick()
{
    CopyToClipboard();
    SendScrollMessage();
}

function UpdateMessage()
{
    message.innerHTML = "<a id='messageLink' style='cursor:pointer;color:#3572f4;text-decoration:underline;'>" + listAddress[selectedAddress]  + "</a>" ;
    message.innerHTML += "<br>" + (selectedAddress + 1 ) + "/" + listAddress.length;
    if(listAddress[selectedAddress])
    {
        document.getElementsByTagName("body")[0].setAttribute("style","min-width:500px;");
    }

    document.getElementById("messageLink").addEventListener("click", HandleAddressClick);
}

// Update price ticker according to the amount
function UpdatePrice()
{
    let element = document.getElementById("nano_amount");
    if(element && element.value && element.value > 0)
    {
        let elemPrice = document.getElementById("price_tag");
        let resp = JSON.parse(httpGet("https://min-api.cryptocompare.com/data/pricemulti?fsyms=NANO&tsyms=BTC,USD,EUR&api_key=6adba1b1c5bfc11a8b427216403e62d9908b0936bff3189fccdb91218f89506b"));

        let amount = element.value;
        let finalString = (amount * resp.NANO.BTC).toFixed(7) + " BTC"+ "<br/>" + (amount * resp.NANO.EUR).toFixed(2) + " EUR"+ "<br/>" + (amount * resp.NANO.USD).toFixed(2) + " USD";

        elemPrice.innerHTML = finalString;
    }
}

function DecrementSelectedAddress()
{
    if(listAddress[selectedAddress -1] != undefined)
    {
        selectedAddress--;
        UpdateMessage();
    }
}

function IncrementSelectedAddress()
{
    if(listAddress[selectedAddress+1] != undefined)
    {
        selectedAddress++;
        UpdateMessage();
    }
}

function MouseOver()
{
    document.getElementById("rightArrow").style.color = "#3789da";
    document.getElementById("leftArrow").style.color = "#3789da";
}

function MouseOut()
{
    document.getElementById("rightArrow").style.color = "#EC6022";
    document.getElementById("leftArrow").style.color = "#EC6022";
}

function CreateNewTab(url)
{
    chrome.tabs.create({url: url});
}

function DonationButtonPressed()
{
    CreateNewTab("https://www.nanode.co/account/xrb_3cdcbwubbbief9eoqhx1e9piq6g9hpek7jssegoc4nc1ezkeaet8fyzf5mmi");
}

function ImageLogoPressed()
{
    if(listAddress[selectedAddress] && !IsFalseNanoAddress(listAddress[selectedAddress]) && DoesAddressExistOnNetwork(listAddress[selectedAddress]))
    {
        let nanodeAddress = "https://www.nanode.co/account/" + listAddress[selectedAddress]
        CreateNewTab(nanodeAddress);
    }
    else
    {
        CreateNewTab("https://nano.org/en");
    }
}

// Function used to hide everything on the page except the brainblocks button
function hideStuff(){
    var el = document.querySelector('#content_container');
    var node, nodes = [];
    
    do {
      var parent = el.parentNode;
      
      // Collect element children
      for (var i=0, iLen=parent.childNodes.length; i<iLen; i++) {
        node = parent.childNodes[i];
  
        // Collect only sibling nodes that are elements and not the current element
        if (node.nodeType == 1 && node != el) {
          nodes.push(node);
        }
      }
  
      // Go up to parent
      el = parent;
  
    // Stop when processed the body's child nodes
    } while (el.tagName.toLowerCase() != 'body');
  
    // Hide the collected nodes
    nodes.forEach(function(node){
      node.style.display = 'none';
    });
}

function TipButtonPressed()
{
    if(listAddress.length > 0 && listAddress[selectedAddress] && !IsFalseNanoAddress(listAddress[selectedAddress]) && DoesAddressExistOnNetwork(listAddress[selectedAddress]) )
    {
        let nbreNano = document.getElementById("nano_amount").value;
        if(nbreNano >= 0.000001)
        {

            let nanoToRai = nbreNano * 1000000;

            // Render the Nano button
            brainblocks.Button.render({
                    
                // Pass in payment options
                payment: {
                    currency: 'rai',
                    amount: nanoToRai,
                    destination: listAddress[selectedAddress]
                },

                // Handle successful payments
                onPayment: function(data) {
                    // 4. Call BrainBlocks API to verify data.token
                    // See tab #2
                }
                }, '#nano-button');


            // Change window size
            document.getElementsByTagName("body")[0].setAttribute("style","min-width:230px;");

            // Make sure brainblocks button is visible
            let brainblocksButton = document.getElementById("nano-button");
            brainblocksButton.style.display = 'block';
            hideStuff();
        }
    }
}





function onWindowLoad() {

    var message = document.querySelector('#message');

    document.getElementById("tip_button").addEventListener("click", TipButtonPressed);

    document.getElementById("donation").addEventListener("click", DonationButtonPressed);

    document.getElementById("image_logo").addEventListener("click", ImageLogoPressed);

    document.getElementById("nano_amount").addEventListener("keyup", UpdatePrice);
    document.getElementById("nano_amount").addEventListener("mouseup", UpdatePrice);

    document.getElementById("rightArrow").addEventListener("click", IncrementSelectedAddress);
    document.getElementById("leftArrow").addEventListener("click", DecrementSelectedAddress);

    document.getElementById("rightArrow").addEventListener("mouseover", MouseOver);
    document.getElementById("rightArrow").addEventListener("mouseout", MouseOut);

    document.getElementById("leftArrow").addEventListener("mouseover", MouseOver);
    document.getElementById("leftArrow").addEventListener("mouseout", MouseOut);
  
    if(!init)
    {
        // Inject script to retrieve the source code of the current tab
        chrome.tabs.executeScript(null, {
            file: "getPageSources.js"
          }, function() {
            // If you try and inject into an extensions page or the webstore/NTP you'll get an error
            if (chrome.runtime.lastError) {
              message.innerText = "You can't use the extension here !";
            }
          });

          // Inject script to scroll through the address on click
          chrome.tabs.executeScript(null, {
            file: "scrollToAddress.js"
          }, function() {
            // If you try and inject into an extensions page or the webstore/NTP you'll get an error
            if (chrome.runtime.lastError) {
              message.innerText = "You can't use the extension here !";
            }
          });


        init = true;
    }

}
window.onload = onWindowLoad;

chrome.runtime.onMessage.addListener(function(request, sender) {

    if(!initVerif){

        if (request.action == "getSource") {
           
    
            if(DescriptionHasNanoAddress(request.source))
            {
                let nanoAddress = GetNanoAddress(request.source);

                if(typeof nanoAddress !== 'undefined' && nanoAddress.length > 0 )
                {
                    listAddress = nanoAddress;
                    UpdateMessage();
                }
                else
                {
                    message.innerText = "No nano address found";
                }
               
            }
            else
            {
                message.innerText = "No nano address found";
            }

            initVerif = true;
        }
    }

});


chrome.runtime.onConnect.addListener(function(port) {
    console.assert(port.name == "nano-pay");
    portPipe = port;

    port.onMessage.addListener(function(msg) {
        if(msg.init != "success")
        {
            message.innerText = "Failed to communicate with scrollToAddress script";
        }
    });

});