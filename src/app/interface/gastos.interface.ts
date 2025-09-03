export interface Data{
    labels: string[]; // Título del gráfico
    datasets:DataSet[]    
  };
 export interface DataSet{    
      label: string; // Nombre del conjunto de datos
      data: number[]; // Numeros de la gráfica
      backgroundColor: string[ ]; // Color de fondo de las barras
      borderColor: string[]; // Color del borde de las barras
      borderWidth: 2; // Ancho del borde de las barras
    }
  

  
  
