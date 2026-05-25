def predict_food(image_path: str):
    # TODO:
    # 1. Load trained model.
    # 2. Read image using OpenCV.
    # 3. Preprocess image.
    # 4. Predict food class.
    # 5. Return food name and confidence.
    return {
        "food_name": "Apple",
        "confidence": 0.94
    }


if __name__ == "__main__":
    print(predict_food("sample_food.jpg"))
