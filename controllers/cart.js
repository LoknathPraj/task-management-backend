const { validationResult } = require("express-validator");
const Cart = require("../model/cart");
const Product = require("../model/product");
;

exports.addCartItem = (req, res, next) => {
  const cartItem = req.body.cart_item;
  console.log(cartItem);

  if (!cartItem) {
    const err = new Error("cartitem cannot be empty");
    throw err;
  }

  Cart.findOne({ creator: req.userId })
    .then((cart) => {
      if (cart) {
        let isAvalilable = false;
        cart.cartItems.map((element, index) => {
          if (element.id == cartItem.id) {
            isAvalilable = true;
            cart.cartItems[index].qty = cartItem.qty + element.qty;
          }
        });

        if (!isAvalilable) {
          cart.cartItems.push(cartItem);
        }

        return cart.save();
      } else {
        const cart = new Cart({
          cartItems: cartItem,
          creator: req.userId,
        });
        return cart.save();
      }
    })
    .then((result) => {
      console.log(result);
      res.status(201).json({
        message: "Item added into cart successfully!",
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getCartItem = async(req, res, next) => {
let cartList=[];
Cart.findOne({creator:req.userId})
.then(cart=>{
    let ids=[]
    if(!cart){
     const err=new Error("Cart data not found!")
     throw err
    }
    if(cart){
        ids= cart.cartItems.map((element)=>element.id)
        cartList=cart.cartItems
    }

    return   Product.find({ 
        _id: {
            $in:ids
        }
})

  
    }).then((result) => {
        // let lCart=[...result]
        
       let jsonObjectList=[]
if(cartList && cartList.length>0){

    for(var i=0;i<cartList.length;i++){

      let newObj={
        _id:result[i]._id,
        title:result[i].title,
        price:result[i].price,
        category_id:result[i].category_id,
        imageUrl:result[i].imageUrl,
        description:result[i].description,
        qty:cartList[i].qty

      }

      jsonObjectList.push(newObj)
       
       
    }
}

        res.status(200).json({
            data:jsonObjectList,
          message: "Item fetched  successfully!",
        });
      })
      .catch((err) => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });

        
         
         
 
};
