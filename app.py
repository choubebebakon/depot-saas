import os
from dotenv import load_dotenv
from google import genai

# 1. Chargement de la clé API
load_dotenv()
client = genai.Client()

def envoyer_prompt(texte):
    try:
        # Vous pouvez changer le modèle ici si besoin
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=texte
        )
        return response.text
    except Exception as e:
        return f"Erreur : {e}"

# 2. Boucle interactive
if __name__ == "__main__":
    print("--- Console Gemini SaaS (Tapez 'quitter' pour arrêter) ---")
    
    while True:
        # On récupère votre saisie dans le terminal
        user_input = input("\nVotre prompt : ")
        
        # Condition pour arrêter le programme
        if user_input.lower() == 'quitter':
            print("Fermeture de la session. Au revoir !")
            break
            
        # Appel de l'API et affichage
        print("Réflexion de l'IA...")
        reponse = envoyer_prompt(user_input)
        print("\nGemini : " + reponse)