def determinant(matrix):
    """
    Calculate the determinant of a square matrix using cofactor expansion.

    :param matrix: List of lists, representing a square matrix
    :return: Determinant of the matrix
    """
    # Base case: if the matrix is 1x1, the determinant is the single element
    if len(matrix) == 1:
        return matrix[0][0]

    # Base case: if the matrix is 2x2, calculate the determinant directly
    if len(matrix) == 2:
        return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0]

    det = 0
    for col in range(len(matrix)):
        # Calculate the minor matrix for the current element
        minor = [
            [matrix[i][j] for j in range(len(matrix)) if j != col]
            for i in range(1, len(matrix))
        ]

        # Cofactor expansion: (-1)^(row+col) * element * determinant(minor)
        cofactor = (-1) ** col * matrix[0][col] * determinant(minor)

        # Add to determinant
        det += cofactor

    return det


# Example usage:
matrix = [[1, 2, 3], [0, 1, 4], [5, 6, 0]]

print("Determinant:", determinant(matrix))
