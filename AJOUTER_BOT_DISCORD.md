# 🤖 Comment Ajouter le Bot Discord au Serveur

## ⚠️ Différence importante

L'image que vous voyez montre l'**application OAuth2** "TENFSITE" avec des permissions. C'est différent du **bot Discord** !

- **Application OAuth2** : Permet aux utilisateurs de se connecter avec Discord
- **Bot Discord** : Permet de récupérer les données du serveur (membres VIP, etc.)

Vous devez ajouter le **bot** séparément au serveur.

---

## 📋 Étapes pour ajouter le bot Discord

### Étape 1 : Aller sur Discord Developer Portal

1. Allez sur https://discord.com/developers/applications
2. Sélectionnez votre application **"TENFSITE"**

### Étape 2 : Vérifier que le bot existe

1. Dans le menu de gauche, cliquez sur **"Bot"**
2. Si vous voyez une section "Token" → Le bot existe déjà ✅
3. Si vous voyez un bouton **"Add Bot"** → Cliquez dessus pour créer le bot

### Étape 3 : Générer l'URL d'invitation du bot

1. Dans le menu de gauche, cliquez sur **"OAuth2"**
2. Cliquez sur **"URL Generator"** (générateur d'URL)
3. Dans la section **"SCOPES"**, cochez **UNIQUEMENT** :
   - ✅ **`bot`** (IMPORTANT : c'est ce qui différencie un bot d'une application OAuth2)

4. Dans la section **"BOT PERMISSIONS"**, cochez :
   - ✅ **View Channels** (Voir les salons)
   - ✅ **Read Message History** (Lire l'historique des messages)
   - ✅ **View Server Members** (OBLIGATOIRE - Voir les membres du serveur)

5. **Copiez l'URL générée** en bas de la page
   - Elle ressemblera à : `https://discord.com/api/oauth2/authorize?client_id=...&permissions=...&scope=bot`

### Étape 4 : Ajouter le bot au serveur

1. **Ouvrez l'URL copiée** dans votre navigateur
2. Une page Discord s'ouvre avec la liste de vos serveurs
3. **Sélectionnez votre serveur Discord** (ID: `535244857891880970`)
4. Cliquez sur **"Autoriser"** ou **"Authorize"**
5. Complétez le CAPTCHA si demandé

### Étape 5 : Vérifier que le bot est ajouté

1. Ouvrez votre serveur Discord
2. Allez dans **Paramètres du serveur** → **Membres**
3. Cherchez **"TENFSITE"** dans la liste des membres
4. Le bot doit apparaître (même s'il est hors ligne, c'est normal)

---

## ✅ Vérification finale

### Le bot est correctement ajouté si :

- ✅ Le bot apparaît dans la liste des membres du serveur
- ✅ Le bot a les permissions nécessaires (View Server Members)
- ✅ La variable `DISCORD_BOT_TOKEN` est configurée dans Netlify
- ✅ La page `/vip` fonctionne et affiche les membres VIP

### Le bot n'est PAS correctement ajouté si :

- ❌ Le bot n'apparaît pas dans la liste des membres
- ❌ Vous avez seulement autorisé l'application OAuth2 (comme sur votre image)
- ❌ La page `/vip` est vide ou affiche une erreur

---

## 🔍 Comment savoir si c'est un bot ou une application OAuth2 ?

### Application OAuth2 (ce que vous voyez sur votre image) :
- Fenêtre avec onglets : "À propos de moi", "Serveurs en commun", "Accès aux données"
- Permissions : "Lire les messages", "Présence", "Membres"
- **N'apparaît PAS dans la liste des membres du serveur**

### Bot Discord (ce que vous devez ajouter) :
- Apparaît dans la liste des membres du serveur
- Peut être hors ligne (c'est normal pour votre usage)
- Utilise le scope `bot` dans l'URL Generator

---

## 🆘 Problèmes courants

### Problème : "Le bot n'apparaît pas dans les membres"

**Solution :**
1. Vérifiez que vous avez utilisé l'URL Generator avec le scope **`bot`**
2. Vérifiez que vous avez bien sélectionné le bon serveur lors de l'autorisation
3. Attendez quelques secondes et actualisez la liste des membres

### Problème : "Erreur lors de l'ajout du bot"

**Solution :**
1. Vérifiez que vous avez les permissions d'administrateur sur le serveur
2. Vérifiez que le bot n'est pas déjà ajouté (cherchez-le dans les membres)
3. Essayez de retirer le bot et de le réajouter

### Problème : "Le bot est ajouté mais la page /vip ne fonctionne pas"

**Solution :**
1. Vérifiez que `DISCORD_BOT_TOKEN` est configuré dans Netlify
2. Vérifiez que le token est correct (Discord Developer Portal → Bot → Token)
3. Vérifiez que le bot a la permission "View Server Members"
4. Vérifiez que le rôle "VIP Elite" existe sur le serveur

---

## 📝 Résumé

1. **Application OAuth2** ≠ **Bot Discord**
2. Vous devez ajouter le **bot** séparément via l'URL Generator avec le scope `bot`
3. Le bot peut apparaître "hors ligne" - c'est normal pour votre usage
4. Le bot doit apparaître dans la liste des membres du serveur pour fonctionner

---

## 🎯 Prochaines étapes

Une fois le bot ajouté :
1. Vérifiez qu'il apparaît dans les membres du serveur
2. Testez la page `/vip` sur votre site
3. Si tout fonctionne, le bot est correctement configuré ! ✅















