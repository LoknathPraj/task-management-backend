const express = require('express');
const bodyParser = require('body-parser');
const { default: mongoose } = require('mongoose');
var cors = require('cors')
const path = require('path');
const multer = require('multer');
const app = express();
const corsOptions = {
  credentials: true,
  origin: ['http://localhost:3000', 'http://localhost:80','https://task-management-react-employee.vercel.app/*','https://task-management-react-52fm6wxnf-loknathprajs-projects.vercel.app/*',"https://task-management-backend-orcin-phi.vercel.app"] // Whitelist the domains you want to allow
};
app.use(cors(corsOptions))

// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', 'https://task-management-react-employee.vercel.app/');
//   res.header('Access-Control-Allow-Credentials', 'true');
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
//   next();
// });

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const categoryRoutes = require('./routes/category');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/order');
const worklogRoutes = require('./routes/worklog');
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'images');
    },
    filename: (req, file, cb) => {
      cb(null, new Date().toISOString() + '-' + file.originalname);
    }
  });
  
  const fileFilter = (req, file, cb) => {
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg'
    ) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };

  
  app.get('/home', (req, res) => {
    res.status(200).json('Welcome, your app is working well');
  })
  

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json
app.use(
    multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
  );//for image upload
app.use('/images', express.static(path.join(__dirname, 'images')));


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});


  app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ message: message, data: data });
  });

mongoose.connect('mongodb+srv://loknathpandit555:Zom01uuJCK698JQa@cluster0.zczvwo4.mongodb.net/e-commerece').then(res=>{
    app.listen(8080);
}).catch(err=>console.log(err))
app.use('/api/order',orderRoutes)
app.use('/api/cart',cartRoutes)
app.use('/api/product',productRoutes)
app.use('/api',categoryRoutes)
app.use('/api/feed', feedRoutes);
app.use('/api/worklog',worklogRoutes)
app.use('/api/auth',authRoutes)

