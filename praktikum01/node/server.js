require('dotenv').config();
var express = require("express");
var path = require("path");
var bcrypt = require("bcrypt");
var nodemailer = require('nodemailer');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
var app = express();
// nastavitev seje
app.use(session({
    secret: 'pass123',
    resave: false,
    saveUninitialized: false, // Set to false for better security
    cookie: { 
        secure: false, // Set to true if using HTTPS
        httpOnly: true, // Prevent client-side JS from accessing the cookie
        sameSite: 'lax', // Helps prevent CSRF
        maxAge: 15 * 60 * 1000 // 15 minut
    }
}));
app.use(express.urlencoded({extended:false}));      //lazje za branje get klicov?
app.use(express.json());                            //za vsebino povpreševanj

app.use(express.static(path.join(__dirname, 'public')));

const knex = require('knex')({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  }
});

// aktivnosti
// uporabimo dinamicni endpoint da lahko klicemo endpoint z poljubnimi parametri
// !! tabela sportnaaktivnost ima naziv... ta naziv se mora ujemat z endpointom
app.get('/aktivnosti/:sport', async (req, res) => {
    const sportName = req.params.sport;
    try {
        const sport = await knex('sport')
            .where('naziv', sportName)
            .first();

        if (!sport) {
            return res.status(404).json({ error: 'Sport ni bil najden' });
        }
        const aktivnosti = await knex('sportnaaktivnost')
            .where('FKsport', sport.ID);

        res.json({
            sport: sport,
            aktivnosti: aktivnosti
        });

    }
    catch (error) {
        console.error("Napaka pri pridobivanju aktivnosti:", error);
        res.status(500).json({ error: 'Napaka na strežniku' });
    }
});
// komentarji

// pridobi komentarje za specifično aktivnost
app.get('/aktivnost/:id/komentarji', async (req, res) => {
    console.log('Klican route za komentarje, ID:', req.params.id);
    const aktivnostId = req.params.id;

    try {
        const komentarji = await knex('komentar')
            .join('uporabnik', 'uporabnik.ID', '=', 'komentar.FKuporabnik')
            .where('komentar.FKaktivnost', aktivnostId)
            .select(
                'komentar.ID',
                'komentar.vsebina',
                'komentar.datumObjave',
                'komentar.potDoSlike',
                'komentar.slikaOdobrena',
                'uporabnik.ime',
                'uporabnik.priimek'
            )
            .orderBy('komentar.datumObjave', 'desc');

        console.log('Najdeni komentarji:', komentarji);
        res.json(komentarji);
    } catch (error) {
        console.error("Napaka pri pridobivanju komentarjev:", error);
        res.status(500).json({ error: 'Napaka na strežniku' });
    }
});
app.get('/aktivnost/:id/slike', async (req, res) => {
    const aktivnostId = req.params.id;

    try {
        const slike = await knex('komentar')
            .join('uporabnik', 'uporabnik.ID', '=', 'komentar.FKuporabnik')
            .where('komentar.FKaktivnost', aktivnostId)
            .whereNotNull('komentar.potDoSlike')
            .select(
                'komentar.ID',
                'komentar.potDoSlike',
                'komentar.datumObjave',
                'komentar.slikaOdobrena',
                'uporabnik.ime',
                'uporabnik.priimek'
            )
            .orderBy('komentar.datumObjave', 'desc');

        const slikeSPodatki = slike.map(slika => ({
            ...slika,
            potDoSlike: JSON.parse(slika.potDoSlike)[0] // Vzamemo prvo sliko iz polja
        }));

        res.json(slikeSPodatki);
    } catch (error) {
        console.error("Napaka pri pridobivanju slik:", error);
        res.status(500).json({ error: 'Napaka na strežniku' });
    }
});
// Nastavitev multer za shranjevanje slik
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'public', 'uploads');

        // Ustvari mapo, če ne obstaja
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Dovoljene so samo slike!'), false);
        }
    }
});
// dodaj nov komentar
app.post('/aktivnost/:id/komentarji', upload.array('slike'), async (req, res) => {
    const aktivnostId = req.params.id;
    const { vsebina } = req.body;

    if (!req.session.user) {
        return res.status(401).json({ error: 'Za komentiranje se morate prijaviti' });
    }

    if (!vsebina || vsebina.trim().length === 0) {
        return res.status(400).json({ error: 'Komentar ne sme biti prazen' });
    }

    try {
        // Preveri, če aktivnost obstaja
        const aktivnost = await knex('sportnaaktivnost')
            .where('ID', aktivnostId)
            .first();

        if (!aktivnost) {
            return res.status(404).json({ error: 'Aktivnost ni bila najdena' });
        }

        // Preveri vlogo uporabnika
        const uporabnik = await knex('uporabnik')
            .where('ID', req.session.user.ID)
            .first();

        if (!uporabnik) {
            return res.status(404).json({ error: 'Uporabnik ni bil najden' });
        }

        // Obdelaj poti do slik
        let potiDoSlik = [];
        let slikaOdobrena = null;

        if (req.files && req.files.length > 0) {
            potiDoSlik = req.files.map(file => `/uploads/${file.filename}`);
            // Nastavi status odobritve glede na vlogo uporabnika
            slikaOdobrena = uporabnik.vloga === 'organizator' ? true : null;
        }

        // Dodaj komentar
        const [komentarId] = await knex('komentar').insert({
            vsebina: vsebina.trim(),
            potDoSlike: potiDoSlik.length > 0 ? JSON.stringify(potiDoSlik) : null,
            datumObjave: new Date(),
            FKuporabnik: req.session.user.ID,
            FKaktivnost: aktivnostId,
            slikaOdobrena: slikaOdobrena
        });

        // Pridobi podatke o novem komentarju
        const novKomentar = await knex('komentar')
            .join('uporabnik', 'uporabnik.ID', '=', 'komentar.FKuporabnik')
            .where('komentar.ID', komentarId)
            .select(
                'komentar.ID',
                'komentar.vsebina',
                'komentar.potDoSlike',
                'komentar.datumObjave',
                'komentar.slikaOdobrena',
                'uporabnik.ime',
                'uporabnik.priimek',
                'uporabnik.vloga'
            )
            .first();

        // Pretvori JSON string nazaj v array
        if (novKomentar.potDoSlike) {
            novKomentar.potDoSlike = JSON.parse(novKomentar.potDoSlike);
        }

        res.json(novKomentar);
    } catch (error) {
        console.error('Napaka pri dodajanju komentarja:', error);
        res.status(500).json({ error: 'Napaka pri dodajanju komentarja' });
    }
});

// Dodaj endpoint za odobritev/zavrnitev slike
app.patch('/komentar/:id/slika', async (req, res) => {
    const komentarId = req.params.id;
    const { odobreno } = req.body;

    console.log('Odobritev slike:', { komentarId, odobreno });

    if (!req.session.user) {
        return res.status(401).json({ error: 'Za odobritev slike se morate prijaviti' });
    }

    try {
        // Preveri, če je uporabnik organizator
        const uporabnik = await knex('uporabnik')
            .where('ID', req.session.user.ID)
            .first();

        if (uporabnik.vloga !== 'organizator') {
            return res.status(403).json({ error: 'Samo organizator lahko odobri slike' });
        }

        // Pridobi trenutni komentar in povezane podatke za mail
        const komentar = await knex('komentar')
            .join('uporabnik', 'uporabnik.ID', '=', 'komentar.FKuporabnik')
            .join('sportnaaktivnost', 'sportnaaktivnost.ID', '=', 'komentar.FKaktivnost')
            .where('komentar.ID', komentarId)
            .select(
                'komentar.*',
                'uporabnik.email',
                'uporabnik.ime',
                'sportnaaktivnost.tipIgrisca',
                'sportnaaktivnost.datumAktivnosti',
                'sportnaaktivnost.casAktivnosti',
                'sportnaaktivnost.lokacija',
                'sportnaaktivnost.ID as aktivnostId'
            )
            .first();

        if (!komentar) {
            return res.status(404).json({ error: 'Komentar ni bil najden' });
        }

        // Posodobi status slike
        await knex('komentar')
            .where('ID', komentarId)
            .update({
                slikaOdobrena: odobreno
            });

        // Pošlji email obvestilo
        await slikaEmail(
            komentar.email,
            komentar.ime,
            {
                tipIgrisca: komentar.tipIgrisca,
                datumAktivnosti: komentar.datumAktivnosti,
                casAktivnosti: komentar.casAktivnosti,
                lokacija: komentar.lokacija,
                ID: komentar.aktivnostId
            },
            odobreno
        );

        res.json({ message: 'Status slike uspešno posodobljen' });
    } catch (error) {
        console.error('Napaka pri posodabljanju statusa slike:', error);
        res.status(500).json({ error: 'Napaka pri posodabljanju statusa slike' });
    }
});

// Pridobivanje specifične aktivnosti
app.get('/aktivnost/:id', async (req, res) => {
    const aktivnostId = req.params.id;

    try {
        const aktivnost = await knex('sportnaaktivnost')
            .join('sport', 'sport.ID', '=', 'sportnaaktivnost.FKsport')
            .where('sportnaaktivnost.ID', aktivnostId)
            .select(
                'sportnaaktivnost.*',
                'sport.naziv as sport'
            )
            .first();

        if (!aktivnost) {
            return res.status(404).json({ error: 'Aktivnost ni bila najdena' });
        }
        res.json(aktivnost);
    }
    catch (error) {
        console.error("Napaka pri pridobivanju aktivnosti:", error);
        res.status(500).json({ error: 'Napaka na strežniku' });
    }
});

app.get('/uporabnik/:id/aktivnosti', async (req, res) => {
    const uporabnikId = req.params.id;

    try {
        // Aktivnosti, na katere je uporabnik prijavljen
        const prijavljene = await knex('prijava')
            .join('sportnaaktivnost', 'prijava.FKaktivnost', '=', 'sportnaaktivnost.ID')
            .join('sport', 'sport.ID', '=', 'sportnaaktivnost.FKsport')
            .where('prijava.FKuporabnik', uporabnikId)
            .select(
                'sportnaaktivnost.*',
                'sportnaaktivnost.ID as aktivnostId',
                'sport.naziv as sport',
                'prijava.ID as prijavaId'
            );

        // Aktivnosti, ki jih je uporabnik organiziral (če še niso med prijavljenimi)
        const organizirane = await knex('sportnaaktivnost')
            .leftJoin('sport', 'sport.ID', '=', 'sportnaaktivnost.FKsport')
            .where('sportnaaktivnost.FKuporabnik', uporabnikId)
            .select(
                'sportnaaktivnost.*',
                'sportnaaktivnost.ID as aktivnostId',
                'sport.naziv as sport'
            );

        // Združi brez podvajanja (po ID aktivnosti)
        const vseAktivnostiMap = new Map();
        prijavljene.concat(organizirane).forEach(akt => {
            vseAktivnostiMap.set(akt.aktivnostId, akt);
        });

        const aktivnosti = Array.from(vseAktivnostiMap.values());

        res.json({ aktivnosti });
    } catch (error) {
        console.error("Napaka pri pridobivanju aktivnosti uporabnika:", error);
        res.status(500).json({ error: 'Napaka na strežniku' });
    }
});

app.put('/uporabnik/:id', upload.single('slika'), async (req, res) => {
    const id = req.params.id;
    const { ime, geslo } = req.body;
    const slika = req.file;
    try {
        const updateData = { ime };

        if (geslo && geslo.trim() !== '') {
            const hashed = await bcrypt.hash(geslo, 10);
            updateData.geslo = hashed;
        }

        if (slika) {
            updateData.slika = slika.filename;
        }
        await knex('uporabnik')
            .where({ id })
            .update(updateData);

        res.json({ message: 'Uporabnik uspešno posodobljen' });
    } catch (err) {
        console.error('Napaka pri posodabljanju:', err);
        res.status(500).json({ error: 'Napaka pri posodobitvi uporabnika' });
    }
});

app.get("/uporabnik/:id", async (req, res) => {
    const ID = req.params.id;

    try {
        const uporabnik = await knex("uporabnik").where("ID", ID).first();
        if (uporabnik) {
            res.json(uporabnik);
        } else {
            res.status(404).json({ error: "Uporabnik ni najden" });
        }
    } catch (error) {
        console.error("Napaka pri GET uporabniku:", error);
        res.status(500).json({ error: "Napaka na strežniku" });
    }
});

app.get('/uporabniki', async (req, res) => {
    try {
        const uporabniki = await knex('uporabnik');
        res.json(uporabniki);
    }
    catch (error) {
        console.error("Napaka pri pridobivanju uporabnikov:", error);
        res.status(500).json({ error: 'Napaka na strežniku' });

    }
});

// Uporabniki iskanje
app.get('/uporabnikiIskanje', async (req, res) => {
    const iskanje = req.query.iskanje;

    try {
        let uporabniki;

        if (iskanje && iskanje.trim() !== "") {
            uporabniki = await knex('uporabnik')
                .where('ime', 'like', `%${iskanje}%`)
                .orWhere('email', 'like', `%${iskanje}%`);
        } else {
            uporabniki = await knex('uporabnik');
        }

        // Sestevanje vrednosti na kaj je uporabnik prijavlen in kaj odjavlen
        const enrichedUsers = await Promise.all(uporabniki.map(async (u) => {
            const polnoIme = `${u.ime} ${u.priimek}`;

            const organized = await knex('sportnaaktivnost')
                .where('organizator', polnoIme)
                .count('* as count');

            const attended = await knex('sportnaaktivnost')
                .where('FKuporabnik', u.ID)
                .count('* as count');

            return {
                id: u.ID,
                name: polnoIme,
                username: u.email,
                organizedEvents: parseInt(organized[0].count, 10),
                attendedEvents: parseInt(attended[0].count, 10),
                canceledEvents: u.stOdjav || 0,
                slika: u.slika || null
            };
        }));

        res.json(enrichedUsers);
    } catch (error) {
        console.error("Napaka pri iskanju uporabnikov:", error.message, error.stack);
        res.status(500).json({ error: 'Napaka pri iskanju' });
    }
});

// zanimalo me je kak je ko preko api delaš v url
async function pridobiUporabnikaInAktivnosti(id) {
    const uporabnik = await knex("uporabnik").where("id", id).first();
    if (!uporabnik) return null;

    const polnoIme = `${uporabnik.ime} ${uporabnik.priimek}`;
    const prijavljeneAktivnosti = await knex("sportnaaktivnost")
        .where("FKuporabnik", id)
        .select(
            "id", "organizator", "tipIgrisca", "lokacija", "datumAktivnosti", "casAktivnosti", "minIgralcev", "maxIgralcev", "opis"
        );
    const organiziraneAktivnosti = await knex("sportnaaktivnost")
        .where("organizator", polnoIme)
        .select(
            "id", "organizator", "tipIgrisca", "lokacija", "datumAktivnosti", "casAktivnosti", "minIgralcev", "maxIgralcev", "opis"
        );
    return {
        ...uporabnik,
        organiziraneAktivnosti,
        prijavljeneAktivnosti
    };
}

app.get('/uporabnik/:id/podatkiStran', async (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'html', 'uporabnikPodatki.html'));
});

app.get('/api/uporabnik/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const uporabnik = await pridobiUporabnikaInAktivnosti(id);
        if (!uporabnik) return res.status(404).send("Uporabnik ni najden.");
        res.json(uporabnik);
    } catch (err) {
        console.error(err);
        res.status(500).send("Napaka na strežniku");
    }
});

const validateRegistration = (req, res, next) => {
    const { ime, priimek, email, telefon, geslo } = req.body;

    if (!ime || !priimek || !email || !telefon || !geslo) {
        return res.status(400).json({ error: 'Vsa polja so obvezna' });
    }

    if (!email.includes('@')) {
        return res.status(400).json({ error: 'Neveljaven email naslov' });
    }

    if (geslo.length < 6) {
        return res.status(400).json({ error: 'Geslo mora vsebovati vsaj 6 znakov' });
    }

    next();
};
// Mailtrap
const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 587,
    secure: false, // Use STARTTLS
    requireTLS: true, // Require STARTTLS
    auth: {
        user: "bede661924e6c6",
        pass: "841d0915ad9c15"
    }
});

async function sendWelcomeEmail(email, ime) {
    const mailOptions = {
        from: '"NajdiSoigralce" <test@example.com>',
        to: email,
        subject: 'Dobrodošli v NajdiSoigralce!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">Dobrodošli v NajdiSoigralce, ${ime}!</h2>
                <p style="color: #34495e; font-size: 16px;">Hvala, ker ste se pridružili naši skupnosti športnih navdušencev.</p>
                <p style="color: #34495e; font-size: 16px;">Z vašim računom lahko:</p>
                <ul style="color: #34495e; font-size: 16px;">
                    <li>Iščete športne aktivnosti v vaši bližini</li>
                    <li>Ustvarjate nove športne dogodke</li>
                    <li>Se pridružite obstoječim aktivnostim</li>
                    <li>Komunicirate z drugimi športniki</li>
                </ul>
                <p style="color: #34495e; font-size: 16px;">Začnite že danes in poiščite svoje soigralce!</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="http://localhost:2999/seznam_aktivnosti.html" 
                       style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                        Poglej aktivnosti
                    </a>
                </div>
                <p style="color: #7f8c8d; font-size: 14px; margin-top: 30px;">
                    Če imate kakršna koli vprašanja, nam lahko vedno pišete na support@najdisoigralce.com
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Welcome email sent to', email);
    } catch (error) {
        console.error('Error sending welcome email:', error);
        // Don't throw error, just log it - we don't want to block registration if email fails
    }
}

async function emailNaAktivnost(email, ime, aktivnost, prijava) {
    let stanje = "Uspešno ste se prijavili na";
    if (prijava == false) {
        stanje = "Uspešno ste se odjavili iz"
    }

    const mailOptions = {
        from: '"NajdiSoigralce" <test@example.com>',
        to: email,
        subject: ` ${stanje} : ${aktivnost.tipIgrisca}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px; background-color: #f9f9f9;">
                <h2 style="color: #2c3e50; text-align: center;">Pozdravljen, ${ime}!</h2>
                <p style="color: #34495e; font-size: 16px;">Z veseljem ti sporočamo, da si se uspešno prijavil na naslednjo športno aktivnost:</p>

                <div style="background-color: #ffffff; border: 1px solid #dfe6e9; border-radius: 8px; padding: 16px; margin: 20px 0;">
                    <h3 style="color: #2980b9; margin-bottom: 8px;">${aktivnost.tipIgrisca}</h3>
                    <p style="margin: 4px 0;"><strong>Datum:</strong> ${aktivnost.datumAktivnosti}</p>
                    <p style="margin: 4px 0;"><strong>Čas:</strong> ${aktivnost.casAktivnosti}</p>
                    <p style="margin: 4px 0;"><strong>Lokacija:</strong> ${aktivnost.lokacija}</p>
                    <p style="margin: 4px 0;"><strong>Opis:</strong> ${aktivnost.opis}</p>
                </div>

                <p style="color: #34495e; font-size: 16px;">Ne pozabi preveriti tudi drugih aktivnosti in povabiti prijatelje, da se ti pridružijo!</p>

                <div style="text-align: center; margin-top: 30px;">
                    <a href="http://localhost:2999/seznam_aktivnosti.html" 
                       style="background-color: #27ae60; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px;">
                        Oglej si vse aktivnosti
                    </a>
                </div>

                <p style="color: #95a5a6; font-size: 14px; margin-top: 30px; text-align: center;">
                    Če imaš kakršnakoli vprašanja, nam piši na <a href="mailto:support@najdisoigralce.com">support@najdisoigralce.com</a>.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('email sent to', email);
    } catch (error) {
        console.error('Error sending login email:', error);
    }
}

async function slikaEmail(email, ime, aktivnost, odobreno) {
    const status = odobreno ? 'odobrena' : 'zavrnjena';
    const mailOptions = {
        from: '"NajdiSoigralce" <test@example.com>',
        to: email,
        subject: `Vaša slika je bila ${status}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px; background-color: #f9f9f9;">
                <h2 style="color: #2c3e50; text-align: center;">Pozdravljen/a, ${ime}!</h2>
                <p style="color: #34495e; font-size: 16px;">Sporočamo vam da je bila vaša slika${status}:</p>

                <div style="background-color: #ffffff; border: 1px solid #dfe6e9; border-radius: 8px; padding: 16px; margin: 20px 0;">
                    <h3 style="color: #2980b9; margin-bottom: 8px;">${aktivnost.tipIgrisca}</h3>
                    <p style="margin: 4px 0;"><strong>Datum:</strong> ${aktivnost.datumAktivnosti}</p>
                    <p style="margin: 4px 0;"><strong>Čas:</strong> ${aktivnost.casAktivnosti}</p>
                    <p style="margin: 4px 0;"><strong>Lokacija:</strong> ${aktivnost.lokacija}</p>
                </div>

                <div style="text-align: center; margin-top: 30px;">
                    <a href="http://localhost:2999/enaAktivnost.html?id=${aktivnost.ID}" 
                       style="background-color: #27ae60; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px;">
                        Oglej si aktivnost
                    </a>
                </div>

                <p style="color: #95a5a6; font-size: 14px; margin-top: 30px; text-align: center;">
                    Če imaš kakršnakoli vprašanja, nam piši na <a href="mailto:support@najdisoigralce.com">support@najdisoigralce.com</a>.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Image status email sent to', email);
    } catch (error) {
        console.error('Error sending image status email:', error);
    }
}

// Registracija
app.post('/register', validateRegistration, async (req, res) => {
    try {
        const { ime, priimek, email, telefon, geslo } = req.body;

        // Check if user exists
        const existingUser = await knex('uporabnik').where({ email }).first();
        if (existingUser) {
            return res.status(400).json({ error: 'Uporabnik s tem email naslovom že obstaja' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(geslo, 10);

        // Insert user
        const [userId] = await knex('uporabnik').insert({
            ime,
            priimek,
            email,
            telefonskaSt: telefon,
            geslo: hashedPassword,
            datumPrijave: new Date(),
            vloga: 'igralec' // Default role for new users
        });

        // Send welcome email
        await sendWelcomeEmail(email, ime);

        res.status(201).json({ message: 'Registracija uspešna' });
    } catch (error) {
        console.error('Napaka pri registraciji:', error);
        res.status(500).json({ error: 'Napaka pri registraciji' });
    }
});

// Prijava uporabnika
app.post('/login', async (req, res) => {
    const { email, geslo } = req.body;
    try {
        const uporabnik = await knex('uporabnik').where({ email }).first();

        if (!uporabnik) {
            return res.status(401).json({ error: 'Neveljavno uporabniško ime ali geslo' });
        }

        const passwordMatch = await bcrypt.compare(geslo, uporabnik.geslo);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Neveljavno uporabniško ime ali geslo' });
        }

        req.session.user = {
            ID: uporabnik.ID,
            ime: uporabnik.ime,
            priimek: uporabnik.priimek,
            email: uporabnik.email,
            geslo: uporabnik.geslo,
            telefonskaSt: uporabnik.telefonskaSt,
            datumPrijave: uporabnik.datumPrijave,
            vloga: uporabnik.vloga,
            slika: uporabnik.slika,
        };
        res.json(req.session.user);

    } catch (error) {
        console.error("Napaka pri prijavi:", error);
        res.status(500).json({ error: 'Napaka na strežniku' });
    }
});

// Seja
app.get('/check-session', (req, res) => {
    if (req.session.user) {
        res.json({ valid: true, user: req.session.user });
    } else {
        res.json({ valid: false });
    }
});

// Odjava
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Napaka pri odjavi' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Odjava uspešna' });
    });
});

// Dodajanje aktivnosti
app.post('/aktivnosti', async (req, res) => {
    try {
        const {
            tipIgrisca,
            lokacija,
            datumAktivnosti,
            casAktivnosti,
            maxIgralcev,
            opis,
            organizator,
            sport,
            FKuporabnik
        } = req.body;

        // Poišči ID športa po nazivu (iz URL parametra)
        const sportResult = await knex('sport').where('naziv', sport).first();
        if (!sportResult) {
            return res.status(400).json({ message: 'Šport ni bil najden.' });
        }

        const sportId = sportResult.ID;

        const result = await knex('sportnaaktivnost').insert({
            organizator: organizator,
            tipIgrisca: tipIgrisca,
            lokacija: lokacija,
            datumAktivnosti: datumAktivnosti,
            casAktivnosti: casAktivnosti,
            minIgralcev: 1,
            maxIgralcev: maxIgralcev,
            opis: opis,
            FKuporabnik: FKuporabnik,
            FKsport: sportId
        });

        res.json({
            success: true,
            message: 'Aktivnost uspešno dodana',
            id: result[0]
        });

    }
    catch (error) {
        console.error('Napaka pri dodajanju aktivnosti:', error);
        res.status(500).json({
            success: false,
            message: 'Napaka pri dodajanju aktivnosti: ' + error.message
        });
    }
});

// Brisanje aktivnosti
app.delete('/aktivnosti/:id', async (req, res) => {
    const aktivnostId = req.params.id;

    try {
        const aktivnost = await knex('sportnaaktivnost')
            .where('ID', aktivnostId)
            .first();

        if (!aktivnost) {
            return res.status(404).json({ message: 'Aktivnost ni bila najdena' });
        }

        await knex('sportnaaktivnost')
            .where('ID', aktivnostId)
            .del();

        res.json({ success: true, message: 'Aktivnost uspešno izbrisana' });
    } catch (error) {
        console.error('Napaka pri brisanju aktivnosti:', error);
        res.status(500).json({ success: false, message: 'Napaka na strežniku' });
    }
});

// Urejanje aktivnosti... 
// POLEG put rabimo tudi GET, ker je potrebno najprej pridobiti podatke iz baze, da jih lahko urejamo...
// V html-u namrec niso vsi...
app.put('/aktivnosti/:id', async (req, res) => {
    const id = req.params.id;
    const {
        organizator,
        tipIgrisca,
        lokacija,
        datumAktivnosti,
        casAktivnosti,
        maxIgralcev,
        opis
    } = req.body;

    try {
        const updateResult = await knex('sportnaaktivnost')
            .where({ ID: id })
            .update({
                organizator,
                tipIgrisca,
                lokacija,
                datumAktivnosti,
                casAktivnosti,
                maxIgralcev,
                opis
            });

        if (updateResult === 0) {
            return res.status(404).json({ error: 'Aktivnost ni bila najdena' });
        }

        res.json({ message: 'Aktivnost uspešno posodobljena' });
    } catch (error) {
        console.error("Napaka pri posodabljanju aktivnosti:", error);
        res.status(500).json({ error: 'Napaka na strežniku' });
    }
});

// Preden uporabimo PUT, moramo najprej ptidobiti podatke z GET !! : 
app.get('/aktivnosti/aktivnost/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const aktivnost = await knex('sportnaaktivnost')
            .where({ ID: id })
            .first();

        if (!aktivnost) {
            return res.status(404).json({ error: 'Aktivnost ni bila najdena' });
        }

        res.json(aktivnost);
    } catch (error) {
        console.error("Napaka pri pridobivanju aktivnosti:", error);
        res.status(500).json({ error: 'Napaka na strežniku' });
    }
});

// Prijavljanje na aktivnost
app.put('/aktivnost/:aktivnostId/prijava', async (req, res) => {
    const { aktivnostId } = req.params;
    const { uporabnikId } = req.body;

    if (!uporabnikId) {
        return res.status(400).json({ error: 'UporabnikId je obvezen.' });
    }

    try {
        // Preveri, če je že prijavljen
        const obstaja = await knex('prijava')
            .where({ FKUporabnik: uporabnikId, FKAktivnost: aktivnostId })
            .first();

        if (obstaja) {
            return res.status(400).json({ error: 'Uporabnik je že prijavljen na to aktivnost.' });
        }

        // Vstavi prijavo
        await knex('prijava').insert({
            FKUporabnik: uporabnikId,
            FKAktivnost: aktivnostId,
            datumPrijave: new Date()
        });

        // Povečaj št. igralcev
        await knex('sportnaaktivnost')
            .where('ID', aktivnostId)
            .increment('minIgralcev', 1);

        // Za email
        const aktivnost = await knex('sportnaaktivnost')
            .select('tipIgrisca', 'datumAktivnosti', 'casAktivnosti', 'lokacija', 'opis')
            .where('ID', aktivnostId)
            .first();

        const uporabnik = await knex('Uporabnik')
            .select('email', 'ime')
            .where('ID', uporabnikId)
            .first();

        if (aktivnost && uporabnik) {
            await emailNaAktivnost(uporabnik.email, uporabnik.ime, {
                tipIgrisca: aktivnost.tipIgrisca,
                datumAktivnosti: aktivnost.datumAktivnosti,
                casAktivnosti: aktivnost.casAktivnosti,
                lokacija: aktivnost.lokacija,
                opis: aktivnost.opis
            }, true);
        }

        res.status(200).json({ message: 'Uspešno prijavljen na aktivnost.' });

    } catch (err) {
        console.error('Napaka pri prijavi:', err);
        res.status(500).json({ error: 'Napaka pri prijavi.' });
    }
});

// Odjavljanje iz aktivnosti
app.put('/aktivnost/:aktivnostId/odjava', async (req, res) => {
    const { aktivnostId } = req.params;
    const { uporabnikId } = req.body;

    if (!uporabnikId) {
        return res.status(400).json({ error: 'UporabnikId je obvezen.' });
    }

    try {
        // Preveri, ali obstaja prijava
        const prijava = await knex('prijava')
            .where({ FKUporabnik: uporabnikId, FKAktivnost: aktivnostId })
            .first();

        if (!prijava) {
            return res.status(404).json({ error: 'Uporabnik ni bil prijavljen na to aktivnost.' });
        }

        // Odstrani prijavo
        await knex('prijava')
            .where({ FKUporabnik: uporabnikId, FKAktivnost: aktivnostId })
            .del();

        // Zmanjšaj št. igralcev
        await knex('sportnaaktivnost')
            .where('ID', aktivnostId)
            .decrement('minIgralcev', 1);

        // Povečaj stOdjav uporabniku
        await knex('uporabnik')
            .where('ID', uporabnikId)
            .increment('stOdjav', 1);

        // Email
        const aktivnost = await knex('sportnaaktivnost')
            .select('tipIgrisca', 'datumAktivnosti', 'casAktivnosti', 'lokacija', 'opis')
            .where('ID', aktivnostId)
            .first();

        const uporabnik = await knex('uporabnik')
            .select('email', 'ime')
            .where('ID', uporabnikId)
            .first();

        if (aktivnost && uporabnik) {
            await emailNaAktivnost(uporabnik.email, uporabnik.ime, {
                tipIgrisca: aktivnost.tipIgrisca,
                datumAktivnosti: aktivnost.datumAktivnosti,
                casAktivnosti: aktivnost.casAktivnosti,
                lokacija: aktivnost.lokacija,
                opis: aktivnost.opis
            }, false);
        }

        res.status(200).json({ message: 'Uspešno odjavljen iz aktivnosti.' });

    } catch (err) {
        console.error('Napaka pri odjavi:', err);
        res.status(500).json({ error: 'Napaka pri odjavi.' });
    }
});

// Endpointi za komentarje na glavni strani
app.get('/indexKomentarji', async (req, res) => {
    try {
        const komentarji = await knex('indexkomentarji')
            .join('uporabnik', 'uporabnik.ID', '=', 'indexkomentarji.FKuporabnik')
            .select(
                'indexkomentarji.ID',
                'indexkomentarji.vsebina',
                'indexkomentarji.datumObjave',
                'uporabnik.ime',
                'uporabnik.priimek'
            )
            .orderBy('indexkomentarji.datumObjave', 'desc');

        res.json(komentarji);
    } catch (error) {
        console.error("Napaka pri pridobivanju komentarjev:", error);
        res.status(500).json({ error: 'Napaka na strežniku' });
    }
});

app.post('/indexKomentarji', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Za komentiranje se morate prijaviti' });
    }

    const { vsebina } = req.body;

    if (!vsebina || vsebina.trim().length === 0) {
        return res.status(400).json({ error: 'Komentar ne sme biti prazen' });
    }

    try {
        const [komentarId] = await knex('indexkomentarji').insert({
            vsebina: vsebina.trim(),
            datumObjave: new Date(),
            FKuporabnik: req.session.user.ID
        });

        const novKomentar = await knex('indexkomentarji')
            .join('uporabnik', 'uporabnik.ID', '=', 'indexkomentarji.FKuporabnik')
            .where('indexkomentarji.ID', komentarId)
            .select(
                'indexkomentarji.ID',
                'indexkomentarji.vsebina',
                'indexkomentarji.datumObjave',
                'uporabnik.ime',
                'uporabnik.priimek'
            )
            .first();

        res.json(novKomentar);
    } catch (error) {
        console.error('Napaka pri dodajanju komentarja:', error);
        res.status(500).json({ error: 'Napaka pri dodajanju komentarja' });
    }
});

app.delete('/indexKomentarji/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Za brisanje komentarja se morate prijaviti' });
    }

    try {
        // Preveri, če je uporabnik admin
        const uporabnik = await knex('uporabnik')
            .where('ID', req.session.user.ID)
            .first();

        if (!uporabnik || uporabnik.vloga !== 'admin') {
            return res.status(403).json({ error: 'Nimate dovoljenja za brisanje komentarjev' });
        }

        const deleted = await knex('indexkomentarji')
            .where('ID', req.params.id)
            .del();

        if (deleted) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Komentar ni bil najden' });
        }
    } catch (error) {
        console.error('Napaka pri brisanju komentarja:', error);
        res.status(500).json({ error: 'Napaka pri brisanju komentarja' });
    }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(process.env.PORT);                                   //nastavis port kjer server poslusa
console.log("Server poslusa na portu" + process.env.PORT);
