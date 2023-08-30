const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(express.json());
const axios = require('axios');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));


app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');


var admin = require("firebase-admin");

var serviceAccount = require("./key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Routes

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signupsubmit', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Store user data in Firestore
        const userRef = db.collection('users').doc(email);
        await userRef.set({
            email: email,
            password: password, // Note: In a real application, you should hash the password before storing it.
        });
        const msg="Signup Successfull"
        res.redirect(`login?alertmessage=${encodeURIComponent(msg)}`);
    } catch (error) {
        console.error('Error signing up:', error);
        res.status(500).send('An error occurred while signing up.');
    }
});


app.get('/login', (req, res) => {
    const alertmessage=req.query.alertmessage
    res.render('login',{alertmessage});
});

app.post('/loginsubmit', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Fetch user data from Firestore
        const userRef = db.collection('users').doc(email);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            const msg='user already exists';
            res.redirect(`login?alertmessage=${encodeURIComponent(msg)}`);
            return;
        }

        const userData = userDoc.data();

        if (userData.password === password) {
            const msg="user login successful"
            res.redirect(`dashboard?alertmessage=${encodeURIComponent(msg)}`);
        } else {
            const msg="Invaliid user and password";
            res.redirect(`login?alertmessage=${encodeURIComponent(msg)}`);
        }
    } catch (error) {
        console.error('Error logging in:', error);
        const msg="An error occured while login";
        res.redirect(`login?alertmessage=${encodeURIComponent(msg)}`);
    }
});


app.get('/dashboard',(req,res)=>{
    const alertmessage=req.query.alertmessage;
    res.render('dashboard',{alertmessage})
})


app.get('/explorecity', (req, res) => {
    try {
        const cityName = req.query.cityName;
        console.log(cityName);
        const apiUrl = `http://api.weatherapi.com/v1/forecast.json?key=1eb303fa6fb843c3b06104706230106&q=${encodeURIComponent(cityName)}&days=7`;
        axios.get(apiUrl)
            .then(response => {
                const name = response.data.location.name;
                const country = response.data.location.country;
                const date= response.data.current.last_updated;
                const temp= response.data.current.temp_c;
                const tempp= response.data.current.temp_f;
                const wind=response.data.current.wind_kph;

                res.render('forecastdetails', { name,country,date,temp,tempp,wind});
            })
            .catch(error => {
                console.error(error);
                res.status(500).send('An error occurred');
            });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
});






app.listen(3000, () => {
    console.log('Server is running on port 3000');
});




