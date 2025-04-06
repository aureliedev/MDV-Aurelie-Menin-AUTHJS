# Application Express avec Authentification et Autorisation

Ce projet est une application web utilisant **Express.js** pour le backend avec des fonctionnalités d'authentification et d'autorisation. L'application inclut une gestion des utilisateurs, l'authentification par **JWT** (JSON Web Token), et la gestion des rôles avec l'accès contrôlé aux pages sensibles. L'application utilise également **Passport.js** pour la connexion via **Google OAuth2.0**.

## Prérequis

Avant de commencer, assurez-vous d'avoir les outils suivants installés sur votre machine :

- **Node.js** (version 14 ou supérieure)
- **MySQL**
- **npm**

## Installation

### 1. Cloner le projet

### 2. Installer les dépendances

Exécutez la commande suivante pour installer toutes les dépendances nécessaires au projet :

`npm install`

### 3. Configurer les variables d'environnement

Créez un fichier .env à partir du fichier `.env.example`

### 4. Configurer la base de données

Créez une base de données MySQL et configurez une table users pour stocker les informations des utilisateurs.

Voici les commandes MySQL pour créer la base de données et la table users :

```CREATE DATABASE myapp;

USE myapp;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'intervenant', 'student') DEFAULT 'student'
);
```

Exemple pour assigné un role directement en base de donnée:

````
UPDATE users
SET role = 'admin'
WHERE username = 'username';
```
````
